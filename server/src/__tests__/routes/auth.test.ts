/**
 * Auth API endpoint tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createTestApp } from '../helpers/app.js';
import prisma from '../../lib/prisma.js';

const app = createTestApp();

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  password: '$2a$12$hashedpassword', // bcrypt hash
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'CUSTOMER' as const,
  emailVerified: false,
  avatarUrl: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock: user doesn't exist
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Mock: create user
      vi.mocked(prisma.user.create).mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1987654321',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBeDefined();
    });

    it('should return 409 if email already exists', async () => {
      // Mock: user exists
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Hash the password for comparison
      const hashedPassword = await bcrypt.hash('correctpassword', 12);

      // Mock: user exists with hashed password
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('test@example.com');
      // Password should not be returned
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 for invalid email', async () => {
      // Mock: user not found
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should return 401 for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 12);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'somepassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'somepassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return user profile with valid token', async () => {
      // First, register/login to get a valid token
      const hashedPassword = await bcrypt.hash('testpassword', 12);

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          ...mockUser,
          password: hashedPassword,
        });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        });

      const token = loginResponse.body.data.token;

      // Mock user lookup for /me endpoint
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        ...mockUser,
        _count: {
          bookings: 5,
          documents: 2,
        },
      } as any);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });

    it('should logout successfully with valid token', async () => {
      // Get a valid token first
      const hashedPassword = await bcrypt.hash('testpassword', 12);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success even for non-existent email (prevents enumeration)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account exists');
    });

    it('should return success for existing email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        resetToken: 'test-token',
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'not-an-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 for invalid/non-existent token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newSecurePassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired');
    });

    it('should return 400 for expired token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        resetToken: 'expired-token',
        resetTokenExpiry: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });

      vi.mocked(prisma.user.update).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'expired-token',
          password: 'newSecurePassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('expired');
    });

    it('should reset password successfully with valid token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        resetToken: 'valid-token',
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });

      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        resetToken: null,
        resetTokenExpiry: null,
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-token',
          password: 'newSecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset successfully');
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          password: 'newSecurePassword123!',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'some-token',
          password: 'short',
        });

      expect(response.status).toBe(400);
    });
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});
