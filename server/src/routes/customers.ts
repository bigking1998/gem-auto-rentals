import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly, adminOnly } from '../middleware/auth.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const customerFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['CUSTOMER', 'SUPPORT', 'MANAGER', 'ADMIN']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['CUSTOMER', 'SUPPORT', 'MANAGER', 'ADMIN']).optional(),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

// GET /api/customers - Staff only
router.get('/', authenticate, staffOnly, async (req, res, next) => {
  try {
    const filters = customerFilterSchema.parse(req.query);
    const { page, pageSize, ...filterParams } = filters;

    const where: Record<string, unknown> = {};

    if (filterParams.search) {
      where.OR = [
        { email: { contains: filterParams.search, mode: 'insensitive' } },
        { firstName: { contains: filterParams.search, mode: 'insensitive' } },
        { lastName: { contains: filterParams.search, mode: 'insensitive' } },
      ];
    }

    if (filterParams.role) {
      where.role = filterParams.role;
    }

    const total = await prisma.user.count({ where });

    const customers = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            documents: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        items: customers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id - Staff only or own profile
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = id === req.user!.id;

    if (!isStaff && !isOwner) {
      throw ForbiddenError('You can only view your own profile');
    }

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalAmount: true,
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                year: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            verified: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            documents: true,
            reviews: true,
          },
        },
      },
    });

    if (!customer) {
      throw NotFoundError('Customer not found');
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - Admin only for role changes, staff for other fields
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateCustomerSchema.parse(req.body);

    // Check permissions
    const isAdmin = req.user!.role === 'ADMIN';
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = id === req.user!.id;

    if (!isStaff && !isOwner) {
      throw ForbiddenError('You can only update your own profile');
    }

    // Only admins can change roles
    if (data.role && !isAdmin) {
      throw ForbiddenError('Only admins can change user roles');
    }

    // Check if email is being changed and is unique
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        throw BadRequestError('Email is already in use');
      }
    }

    const customer = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id/profile - Update own profile
router.put('/:id/profile', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateProfileSchema.parse(req.body);

    if (id !== req.user!.id) {
      throw ForbiddenError('You can only update your own profile');
    }

    // Handle password change
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw BadRequestError('Current password is required to change password');
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { password: true },
      });

      if (!user) {
        throw NotFoundError('User not found');
      }

      const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);

      if (!isValidPassword) {
        throw BadRequestError('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 12);

      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });
    }

    // Update other fields
    const { currentPassword, newPassword, ...updateData } = data;

    const customer = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: customer,
      message: data.newPassword ? 'Profile and password updated' : 'Profile updated',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/customers/:id - Admin only
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user!.id) {
      throw BadRequestError('You cannot delete your own account');
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        userId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      },
    });

    if (activeBookings > 0) {
      throw BadRequestError('Cannot delete customer with active bookings');
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id/bookings
router.get('/:id/bookings', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '20' } = req.query;

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = id === req.user!.id;

    if (!isStaff && !isOwner) {
      throw ForbiddenError('You can only view your own bookings');
    }

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);

    const total = await prisma.booking.count({
      where: { userId: id },
    });

    const bookings = await prisma.booking.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        items: bookings,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
