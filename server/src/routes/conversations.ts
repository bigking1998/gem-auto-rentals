import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { ActivityLogger } from '../lib/activityLogger.js';

const router = Router();

// Validation schemas
const createConversationSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  subject: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  bookingId: z.string().optional(),
  initialMessage: z.string().min(1, 'Initial message is required'),
});

const updateConversationSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().nullable().optional(),
  subject: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  contentType: z.enum(['TEXT', 'HTML', 'TEMPLATE']).optional(),
});

// GET /api/conversations - List all conversations (with filters)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      assignedTo,
      customerId,
      priority,
      search,
      unreadOnly,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (assignedTo && typeof assignedTo === 'string') {
      if (assignedTo === 'me') {
        where.assignedToId = req.user!.id;
      } else if (assignedTo === 'unassigned') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedTo;
      }
    }

    if (customerId && typeof customerId === 'string') {
      where.customerId = customerId;
    }

    if (priority && typeof priority === 'string') {
      where.priority = priority;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          lastMessageAt: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          assignedTo: {
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
              status: true,
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
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              senderType: true,
              readAt: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  readAt: null,
                  senderType: 'CUSTOMER',
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Transform to include unread count and last message preview
    const transformedConversations = conversations.map((conv) => ({
      ...conv,
      unreadCount: conv._count.messages,
      lastMessage: conv.messages[0] || null,
      messages: undefined,
      _count: undefined,
    }));

    // Filter for unread only if requested
    const finalConversations = unreadOnly === 'true'
      ? transformedConversations.filter((c) => c.unreadCount > 0)
      : transformedConversations;

    res.json({
      success: true,
      data: finalConversations,
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

// GET /api/conversations/unread-count - Get unread message count
router.get('/unread-count', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (_req, res, next) => {
  try {
    const count = await prisma.message.count({
      where: {
        senderType: 'CUSTOMER',
        readAt: null,
        conversation: {
          status: { in: ['OPEN', 'PENDING'] },
        },
      },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/conversations/:id - Get conversation with messages
router.get('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        assignedTo: {
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
                images: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw NotFoundError('Conversation not found');
    }

    // Get messages with pagination
    const [messages, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        select: {
          id: true,
          content: true,
          contentType: true,
          senderType: true,
          readAt: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              fileSize: true,
              mimeType: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.message.count({ where: { conversationId: id } }),
    ]);

    res.json({
      success: true,
      data: {
        ...conversation,
        messages,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/conversations - Create new conversation
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const data = createConversationSchema.parse(req.body);

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: data.customerId },
      select: { id: true, email: true, role: true },
    });

    if (!customer || customer.role !== 'CUSTOMER') {
      throw BadRequestError('Invalid customer ID');
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

    // Create conversation with initial message
    const conversation = await prisma.conversation.create({
      data: {
        customerId: data.customerId,
        subject: data.subject,
        priority: data.priority || 'NORMAL',
        bookingId: data.bookingId,
        assignedToId: req.user!.id, // Auto-assign to creator
        messages: {
          create: {
            senderId: req.user!.id,
            senderType: 'STAFF',
            content: data.initialMessage,
            contentType: 'TEXT',
          },
        },
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
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: true,
      },
    });

    // Log activity
    await ActivityLogger.conversationCreate(req.user!.id, conversation.id, customer.email);

    // TODO: Send email notification to customer

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/conversations/:id - Update conversation
router.patch('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateConversationSchema.parse(req.body);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!conversation) {
      throw NotFoundError('Conversation not found');
    }

    // Update conversation
    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...data,
        ...(data.status && data.status !== conversation.status
          ? {
              // Add system message for status change
              messages: {
                create: {
                  senderId: req.user!.id,
                  senderType: 'SYSTEM',
                  content: `Status changed from ${conversation.status} to ${data.status}`,
                  contentType: 'TEXT',
                },
              },
            }
          : {}),
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
        assignedTo: {
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

// POST /api/conversations/:id/messages - Send a message
router.post('/:id/messages', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = sendMessageSchema.parse(req.body);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, customerId: true, status: true },
    });

    if (!conversation) {
      throw NotFoundError('Conversation not found');
    }

    // Create message and update conversation
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: req.user!.id,
          senderType: 'STAFF',
          content: data.content,
          contentType: data.contentType || 'TEXT',
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          attachments: true,
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: {
          lastMessageAt: new Date(),
          // Reopen if was resolved/closed
          ...(conversation.status === 'RESOLVED' || conversation.status === 'CLOSED'
            ? { status: 'OPEN' }
            : {}),
        },
      }),
    ]);

    // Log activity
    await ActivityLogger.messageSend(req.user!.id, message.id, id);

    // TODO: Send email notification to customer

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/messages/:id/read - Mark message as read
router.patch('/messages/:messageId/read', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
      select: {
        id: true,
        readAt: true,
        conversationId: true,
      },
    });

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/conversations/:id/read-all - Mark all messages in conversation as read
router.post('/:id/read-all', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await prisma.message.updateMany({
      where: {
        conversationId: id,
        readAt: null,
        senderType: 'CUSTOMER',
      },
      data: { readAt: new Date() },
    });

    res.json({
      success: true,
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/conversations/:id/assign - Assign conversation to staff
router.post('/:id/assign', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedToId } = z.object({
      assignedToId: z.string().nullable(),
    }).parse(req.body);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, assignedToId: true },
    });

    if (!conversation) {
      throw NotFoundError('Conversation not found');
    }

    // Verify staff member if assigning
    if (assignedToId) {
      const staff = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, role: true },
      });

      if (!staff || staff.role === 'CUSTOMER') {
        throw BadRequestError('Invalid staff member');
      }
    }

    // Update assignment and add system message
    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        assignedToId,
        messages: {
          create: {
            senderId: req.user!.id,
            senderType: 'SYSTEM',
            content: assignedToId
              ? `Conversation assigned to staff member`
              : 'Conversation unassigned',
            contentType: 'TEXT',
          },
        },
      },
      include: {
        assignedTo: {
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

// DELETE /api/conversations/:id - Archive/delete conversation (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw NotFoundError('Conversation not found');
    }

    // Soft delete by closing or hard delete
    // For now, we'll just close it
    await prisma.conversation.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    res.json({
      success: true,
      message: 'Conversation closed successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
