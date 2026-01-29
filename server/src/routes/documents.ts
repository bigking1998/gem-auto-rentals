import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { BUCKETS, isStorageConfigured, getSignedUrl, getSignedDownloadUrl, uploadFile } from '../lib/storage.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';

const router = Router();

// Configure multer for memory storage (we'll upload to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'));
    }
  },
});

// Validation schemas
const documentTypeSchema = z.enum(['DRIVERS_LICENSE_FRONT', 'DRIVERS_LICENSE_BACK', 'ID_CARD', 'PASSPORT', 'PROOF_OF_ADDRESS', 'INSURANCE']);

// POST /api/documents/upload - Upload a document
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured. Please contact support.');
    }

    if (!req.file) {
      throw BadRequestError('No file provided');
    }

    const { type, bookingId } = z.object({
      type: documentTypeSchema,
      bookingId: z.string().cuid().optional(),
    }).parse(req.body);

    const userId = req.user!.id;
    const file = req.file;

    // Generate unique file path: userId/type/timestamp-filename
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${type}/${timestamp}-${sanitizedFilename}`;

    // Upload to storage
    const uploadResult = await uploadFile(
      BUCKETS.DOCUMENTS,
      filePath,
      file.buffer,
      file.mimetype
    );

    if ('error' in uploadResult) {
      console.error('Upload error:', uploadResult.error);
      throw BadRequestError('Failed to upload file. Please try again.');
    }

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        userId,
        bookingId: bookingId || null,
        type,
        fileName: file.originalname,
        fileUrl: filePath, // Store the path, not the full URL
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'PENDING',
      },
    });

    // Get a signed URL for immediate access
    const signedUrl = await getSignedUrl(filePath);

    res.status(201).json({
      success: true,
      data: {
        ...document,
        signedUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents - List user's documents
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { type, status, bookingId } = z.object({
      type: documentTypeSchema.optional(),
      status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
      bookingId: z.string().optional(),
    }).parse(req.query);

    const where: Record<string, unknown> = {};

    // Non-staff can only see their own documents
    if (!['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role)) {
      where.userId = req.user!.id;
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (bookingId) where.bookingId = bookingId;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Add signed URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        signedUrl: isStorageConfigured() ? await getSignedUrl(doc.fileUrl) : null,
      }))
    );

    res.json({
      success: true,
      data: documentsWithUrls,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id - Get a specific document
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw NotFoundError('Document not found');
    }

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = document.userId === req.user!.id;

    if (!isStaff && !isOwner) {
      throw NotFoundError('Document not found');
    }

    // Get signed URL
    const signedUrl = isStorageConfigured() ? await getSignedUrl(document.fileUrl) : null;

    res.json({
      success: true,
      data: {
        ...document,
        signedUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/documents/:id/verify - Staff only - Verify or reject a document
router.patch('/:id/verify', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = z.object({
      status: z.enum(['VERIFIED', 'REJECTED']),
      notes: z.string().optional(),
    }).parse(req.body);

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw NotFoundError('Document not found');
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedBy: status === 'VERIFIED' ? req.user!.id : null,
        notes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw NotFoundError('Document not found');
    }

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER'].includes(req.user!.role);
    const isOwner = document.userId === req.user!.id;

    if (!isStaff && !isOwner) {
      throw NotFoundError('Document not found');
    }

    // Only allow deletion of pending documents for non-staff
    if (!isStaff && document.status !== 'PENDING') {
      throw BadRequestError('Cannot delete a verified document');
    }

    // Soft delete - file will be deleted on permanent deletion from trash
    await prisma.document.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/download - Get download URL
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw NotFoundError('Document not found');
    }

    // Check permissions
    const isStaff = ['ADMIN', 'MANAGER', 'SUPPORT'].includes(req.user!.role);
    const isOwner = document.userId === req.user!.id;

    if (!isStaff && !isOwner) {
      throw NotFoundError('Document not found');
    }

    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured');
    }

    // Get a download URL (longer expiry for downloads)
    const downloadUrl = await getSignedDownloadUrl(
      document.fileUrl,
      document.fileName,
      300, // 5 minutes
      BUCKETS.DOCUMENTS
    );

    if (!downloadUrl) {
      throw BadRequestError('Failed to generate download URL');
    }

    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: document.fileName,
        mimeType: document.mimeType,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
