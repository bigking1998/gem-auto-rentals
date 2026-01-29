import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

// Generate invoice number
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

// Validation schemas
const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  bookingId: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    amount: z.number().min(0),
  })).min(1, 'At least one line item is required'),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0),
  dueDate: z.string().transform((s) => new Date(s)),
  notes: z.string().optional(),
});

const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    amount: z.number().min(0),
  })).optional(),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
  notes: z.string().optional().nullable(),
  paidAt: z.string().transform((s) => new Date(s)).optional().nullable(),
});

// GET /api/invoices - List invoices
router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      customerId,
      search,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.InvoiceWhereInput = {};

    if (status && typeof status === 'string') {
      where.status = status as Prisma.EnumInvoiceStatusFilter;
    }

    if (customerId && typeof customerId === 'string') {
      where.customerId = customerId;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate && typeof startDate === 'string') {
        where.issueDate.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.issueDate.lte = new Date(endDate);
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          booking: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              vehicle: {
                select: {
                  make: true,
                  model: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/invoices/:id - Get invoice details
router.get('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            pickupLocation: true,
            dropoffLocation: true,
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                year: true,
                licensePlate: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw NotFoundError('Invoice not found');
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/invoices - Create invoice
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const data = createInvoiceSchema.parse(req.body);

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: data.customerId },
      select: { id: true },
    });

    if (!customer) {
      throw BadRequestError('Customer not found');
    }

    // Verify booking if provided
    if (data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        select: { userId: true },
      });

      if (!booking) {
        throw BadRequestError('Booking not found');
      }

      if (booking.userId !== data.customerId) {
        throw BadRequestError('Booking does not belong to this customer');
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        customerId: data.customerId,
        bookingId: data.bookingId,
        invoiceNumber: generateInvoiceNumber(),
        lineItems: data.lineItems as Prisma.InputJsonValue,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount || 0,
        totalAmount: data.totalAmount,
        dueDate: data.dueDate,
        notes: data.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/invoices/:id - Update invoice
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateInvoiceSchema.parse(req.body);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw NotFoundError('Invoice not found');
    }

    // Don't allow editing paid/refunded invoices
    if (['PAID', 'REFUNDED'].includes(invoice.status) && data.lineItems) {
      throw BadRequestError('Cannot modify line items of paid or refunded invoices');
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        lineItems: data.lineItems as Prisma.InputJsonValue | undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/invoices/:id/send - Send invoice to customer
router.post('/:id/send', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!invoice) {
      throw NotFoundError('Invoice not found');
    }

    // Update status to SENT
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'SENT',
        issueDate: new Date(),
      },
    });

    // TODO: Actually send email with invoice PDF
    // await sendInvoiceEmail(invoice.customer.email, invoice);

    res.json({
      success: true,
      data: updated,
      message: `Invoice sent to ${invoice.customer.email}`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/invoices/:id/pdf - Generate/download PDF
router.get('/:id/pdf', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        booking: {
          include: {
            vehicle: {
              select: {
                make: true,
                model: true,
                year: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw NotFoundError('Invoice not found');
    }

    // For now, return invoice data in a format suitable for PDF generation
    // In production, you'd use a PDF library like pdfkit or puppeteer
    res.json({
      success: true,
      data: {
        invoice,
        pdfUrl: invoice.pdfUrl || null,
        message: 'PDF generation would happen here in production',
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/invoices/from-booking/:bookingId - Create invoice from booking
router.post('/from-booking/:bookingId', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: { id: true },
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
          },
        },
      },
    });

    if (!booking) {
      throw NotFoundError('Booking not found');
    }

    // Get company settings for tax rate
    const companySettings = await prisma.companySettings.findFirst();
    const taxRate = companySettings?.taxRate ? Number(companySettings.taxRate) : 0;

    // Calculate days
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Build line items
    const lineItems = [
      {
        description: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model} - ${days} day(s)`,
        quantity: days,
        unitPrice: Number(booking.dailyRate),
        amount: Number(booking.dailyRate) * days,
      },
    ];

    // Add extras if present
    if (booking.extras) {
      const extras = booking.extras as Record<string, { name: string; price: number; selected: boolean }>;
      for (const [, extra] of Object.entries(extras)) {
        if (extra.selected) {
          lineItems.push({
            description: extra.name,
            quantity: days,
            unitPrice: extra.price,
            amount: extra.price * days,
          });
        }
      }
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        customerId: booking.userId,
        bookingId: booking.id,
        invoiceNumber: generateInvoiceNumber(),
        lineItems: lineItems as Prisma.InputJsonValue,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CUSTOMER-FACING ENDPOINTS (for web app)
// ==========================================

// NOTE: This route MUST be defined before /:id routes to prevent 'my' being treated as an ID
// GET /api/invoices/my - Get current user's invoices
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const invoices = await prisma.invoice.findMany({
      where: { customerId: userId },
      include: {
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            vehicle: {
              select: {
                make: true,
                model: true,
                year: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/invoices/:id/download - Download invoice PDF (customer-facing)
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        booking: {
          include: {
            vehicle: {
              select: {
                make: true,
                model: true,
                year: true,
                licensePlate: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw NotFoundError('Invoice not found');
    }

    // Check ownership or admin access
    if (invoice.customerId !== userId && !['ADMIN', 'MANAGER', 'SUPPORT'].includes(userRole)) {
      throw NotFoundError('Invoice not found');
    }

    // Get company settings for branding
    const companySettings = await prisma.companySettings.findFirst();

    // Generate HTML receipt
    const lineItems = invoice.lineItems as Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatCurrency = (amount: unknown) => {
      return `$${(Number(amount) || 0).toFixed(2)}`;
    };

    // Helper to escape HTML for XSS prevention
    const escapeHtml = (str: string | undefined | null): string => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1f2937; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #ea580c; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; color: #1f2937; margin-bottom: 5px; }
    .invoice-number { color: #6b7280; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
    .info-block p { margin: 4px 0; font-size: 14px; }
    .info-block strong { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f9fafb; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    td { padding: 16px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .amount { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #1f2937; padding-top: 16px; margin-top: 8px; }
    .status { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status.paid { background: #dcfce7; color: #15803d; }
    .status.pending { background: #fef3c7; color: #b45309; }
    .status.draft { background: #e5e7eb; color: #4b5563; }
    .footer { margin-top: 60px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${companySettings?.companyName || 'Gem Auto Rentals'}</div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p class="invoice-number">${invoice.invoiceNumber}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <p class="section-title">Bill To</p>
      <p><strong>${escapeHtml(invoice.customer.firstName)} ${escapeHtml(invoice.customer.lastName)}</strong></p>
      <p>${escapeHtml(invoice.customer.email)}</p>
      ${invoice.customer.phone ? `<p>${escapeHtml(invoice.customer.phone)}</p>` : ''}
    </div>
    <div class="info-block" style="text-align: right;">
      <p class="section-title">Invoice Details</p>
      <p><strong>Date:</strong> ${formatDate(invoice.issueDate)}</p>
      <p><strong>Due:</strong> ${formatDate(invoice.dueDate)}</p>
      <p><strong>Status:</strong> <span class="status ${invoice.status.toLowerCase()}">${invoice.status}</span></p>
    </div>
  </div>

  ${invoice.booking ? `
  <div class="section">
    <p class="section-title">Rental Details</p>
    <div class="info-block">
      <p><strong>Vehicle:</strong> ${invoice.booking.vehicle.year} ${invoice.booking.vehicle.make} ${invoice.booking.vehicle.model}</p>
      <p><strong>Rental Period:</strong> ${formatDate(invoice.booking.startDate)} - ${formatDate(invoice.booking.endDate)}</p>
    </div>
  </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Qty</th>
        <th class="amount">Unit Price</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems.map(item => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="amount">${item.quantity}</td>
          <td class="amount">${formatCurrency(item.unitPrice)}</td>
          <td class="amount">${formatCurrency(item.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${formatCurrency(invoice.subtotal)}</span>
    </div>
    ${Number(invoice.taxAmount) > 0 ? `
    <div class="totals-row">
      <span>Tax</span>
      <span>${formatCurrency(invoice.taxAmount)}</span>
    </div>
    ` : ''}
    ${Number(invoice.discountAmount) > 0 ? `
    <div class="totals-row">
      <span>Discount</span>
      <span>-${formatCurrency(invoice.discountAmount)}</span>
    </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total</span>
      <span>${formatCurrency(invoice.totalAmount)}</span>
    </div>
  </div>

  ${invoice.notes ? `
  <div class="section" style="margin-top: 40px;">
    <p class="section-title">Notes</p>
    <p style="font-size: 14px; color: #4b5563;">${escapeHtml(invoice.notes)}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>${companySettings?.companyName || 'Gem Auto Rentals'}</strong></p>
    ${companySettings?.companyAddress ? `<p>${companySettings.companyAddress}</p>` : '<p>Mulberry, FL</p>'}
    ${companySettings?.companyPhone ? `<p>Phone: ${companySettings.companyPhone}</p>` : ''}
    ${companySettings?.companyEmail ? `<p>Email: ${companySettings.companyEmail}</p>` : ''}
    <p style="margin-top: 20px;">Thank you for your business!</p>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.html"`);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

export default router;
