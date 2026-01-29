import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../middleware/errorHandler.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../lib/email.js';

const router = Router();

// SSO code storage (in-memory, codes expire after 30 seconds)
// In production with multiple server instances, use Redis instead
interface SsoCode {
  userId: string;
  role: string;
  createdAt: number;
  used: boolean;
}

const ssoCodeStore = new Map<string, SsoCode>();
const SSO_CODE_EXPIRY_MS = 30 * 1000; // 30 seconds

// Cleanup expired SSO codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of ssoCodeStore.entries()) {
    if (now - data.createdAt > SSO_CODE_EXPIRY_MS || data.used) {
      ssoCodeStore.delete(code);
    }
  }
}, 60 * 1000); // Cleanup every minute

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// Generate JWT token
function generateToken(userId: string, role: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId, role }, secret, { expiresIn } as jwt.SignOptions);
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    // Send welcome email (async, don't block response)
    sendWelcomeEmail(user.email, user.firstName).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (_req, res) => {
  // JWT is stateless, so logout is handled client-side
  // Could add token blacklisting with Redis if needed
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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

    if (!user) {
      throw BadRequestError('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters'),
      })
      .parse(req.body);

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw BadRequestError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/sso-code - Generate a short-lived SSO code for admin dashboard redirect
// This is used instead of passing tokens via URL for security
router.post('/sso-code', authenticate, async (req, res, next) => {
  try {
    const user = req.user!;

    // Only allow admin roles to generate SSO codes
    const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'SUPPORT'];
    if (!ADMIN_ROLES.includes(user.role)) {
      throw UnauthorizedError('Only admin users can generate SSO codes');
    }

    // Generate a secure random code
    const code = crypto.randomBytes(32).toString('hex');

    // Store the code with user info
    ssoCodeStore.set(code, {
      userId: user.id,
      role: user.role,
      createdAt: Date.now(),
      used: false,
    });

    res.json({
      success: true,
      data: {
        code,
        expiresIn: SSO_CODE_EXPIRY_MS / 1000, // seconds
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/sso-exchange - Exchange an SSO code for a token
// Admin dashboard calls this to get a valid token from a code
router.post('/sso-exchange', async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().min(1, 'Code is required') }).parse(req.body);

    // Look up the code
    const ssoData = ssoCodeStore.get(code);

    if (!ssoData) {
      throw UnauthorizedError('Invalid or expired SSO code');
    }

    // Check if code has expired
    if (Date.now() - ssoData.createdAt > SSO_CODE_EXPIRY_MS) {
      ssoCodeStore.delete(code);
      throw UnauthorizedError('SSO code has expired');
    }

    // Check if code has already been used (prevent replay attacks)
    if (ssoData.used) {
      ssoCodeStore.delete(code);
      throw UnauthorizedError('SSO code has already been used');
    }

    // Mark code as used
    ssoData.used = true;

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: ssoData.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      ssoCodeStore.delete(code);
      throw UnauthorizedError('User not found');
    }

    // Generate a new token for the admin dashboard
    const token = generateToken(user.id, user.role);

    // Clean up the used code
    ssoCodeStore.delete(code);

    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (user) {
      // Generate a secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Send password reset email
      const emailResult = await sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetToken
      );

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        // Don't expose email failures to user for security
      }
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = z
      .object({
        token: z.string().min(1, 'Token is required'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      })
      .parse(req.body);

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user) {
      throw BadRequestError('Invalid or expired reset token');
    }

    // Check if token has expired
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      // Clear expired token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      throw BadRequestError('Reset token has expired. Please request a new password reset.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
