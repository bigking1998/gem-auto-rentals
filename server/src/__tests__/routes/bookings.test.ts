/**
 * Bookings API endpoint tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createTestApp } from '../helpers/app.js';
import prisma from '../../lib/prisma.js';

const app = createTestApp();

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'customer@example.com',
  password: '',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'CUSTOMER' as const,
  emailVerified: true,
  avatarUrl: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  password: '',
  firstName: 'Admin',
  lastName: 'User',
  phone: null,
  role: 'ADMIN' as const,
  emailVerified: true,
  avatarUrl: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockVehicle = {
  id: 'vehicle-1',
  make: 'Toyota',
  model: 'Camry',
  year: 2024,
  category: 'STANDARD' as const,
  dailyRate: 65,
  status: 'AVAILABLE' as const,
  images: ['https://example.com/car.jpg'],
  features: ['Bluetooth'],
  description: 'A reliable sedan',
  seats: 5,
  doors: 4,
  transmission: 'AUTOMATIC' as const,
  fuelType: 'GASOLINE' as const,
  mileage: 5000,
  color: 'Silver',
  licensePlate: 'ABC-1234',
  vin: '1HGBH41JXMN109186',
  location: 'Main Office',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBooking = {
  id: 'booking-1',
  userId: 'user-1',
  vehicleId: 'vehicle-1',
  startDate: new Date('2024-03-20'),
  endDate: new Date('2024-03-23'),
  status: 'PENDING' as const,
  dailyRate: 65,
  totalAmount: 195,
  pickupLocation: 'Main Office',
  dropoffLocation: 'Main Office',
  extras: { insurance: true, gps: false },
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper to get user token
async function getUserToken(): Promise<string> {
  const hashedPassword = await bcrypt.hash('password123', 12);
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
    ...mockUser,
    password: hashedPassword,
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'customer@example.com', password: 'password123' });

  return response.body.data.token;
}

// Helper to get admin token
async function getAdminToken(): Promise<string> {
  const hashedPassword = await bcrypt.hash('adminpass', 12);
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
    ...mockAdminUser,
    password: hashedPassword,
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'adminpass' });

  return response.body.data.token;
}

describe('Bookings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/bookings', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/bookings');
      expect(response.status).toBe(401);
    });

    it('should return user bookings for customers', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.count).mockResolvedValue(2);
      vi.mocked(prisma.booking.findMany).mockResolvedValue([
        {
          ...mockBooking,
          vehicle: {
            id: 'vehicle-1',
            make: 'Toyota',
            model: 'Camry',
            year: 2024,
            images: [],
            category: 'STANDARD',
          },
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'customer@example.com',
          },
          payment: null,
        },
        {
          ...mockBooking,
          id: 'booking-2',
          status: 'CONFIRMED',
          vehicle: {
            id: 'vehicle-1',
            make: 'Toyota',
            model: 'Camry',
            year: 2024,
            images: [],
            category: 'STANDARD',
          },
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'customer@example.com',
          },
          payment: { id: 'p1', status: 'SUCCEEDED', amount: 195 },
        },
      ] as any);

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
    });

    it('should filter by status', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.count).mockResolvedValue(1);
      vi.mocked(prisma.booking.findMany).mockResolvedValue([
        {
          ...mockBooking,
          status: 'CONFIRMED',
          vehicle: {
            id: 'vehicle-1',
            make: 'Toyota',
            model: 'Camry',
            year: 2024,
            images: [],
            category: 'STANDARD',
          },
          user: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'customer@example.com',
          },
          payment: null,
        },
      ] as any);

      const response = await request(app)
        .get('/api/bookings')
        .query({ status: 'CONFIRMED' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow admin to see all bookings', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.booking.count).mockResolvedValue(5);
      vi.mocked(prisma.booking.findMany).mockResolvedValue([
        {
          ...mockBooking,
          vehicle: { id: 'v1', make: 'Toyota', model: 'Camry', year: 2024, images: [], category: 'STANDARD' },
          user: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          payment: null,
        },
      ] as any);

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should return booking details for owner', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        vehicle: mockVehicle,
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'customer@example.com',
          phone: '+1234567890',
        },
        payment: null,
      } as any);

      const response = await request(app)
        .get('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('booking-1');
      expect(response.body.data).toHaveProperty('vehicle');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should return 404 for non-existent booking', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/bookings/non-existent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return 403 for non-owner customer', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'different-user', // Not the logged in user
        vehicle: mockVehicle,
        user: { id: 'different-user', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: null },
        payment: null,
      } as any);

      const response = await request(app)
        .get('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to see any booking', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'other-user',
        vehicle: mockVehicle,
        user: { id: 'other-user', firstName: 'Other', lastName: 'User', email: 'other@example.com', phone: null },
        payment: null,
      } as any);

      const response = await request(app)
        .get('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/bookings', () => {
    it('should create a booking', async () => {
      const token = await getUserToken();

      // Mock: vehicle exists and is available
      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(mockVehicle as any);

      // Mock: no conflicting bookings
      vi.mocked(prisma.booking.findFirst).mockResolvedValue(null);

      // Mock: create booking
      vi.mocked(prisma.booking.create).mockResolvedValue({
        ...mockBooking,
        vehicle: {
          id: 'vehicle-1',
          make: 'Toyota',
          model: 'Camry',
          year: 2024,
          images: [],
        },
      } as any);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: 'vehicle-1',
          startDate: futureDate.toISOString(),
          endDate: endDate.toISOString(),
          pickupLocation: 'Main Office',
          dropoffLocation: 'Airport',
          extras: { insurance: true },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should reject booking for unavailable vehicle', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
        ...mockVehicle,
        status: 'MAINTENANCE',
      } as any);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: 'vehicle-1',
          startDate: futureDate.toISOString(),
          endDate: endDate.toISOString(),
          pickupLocation: 'Main Office',
          dropoffLocation: 'Main Office',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not available');
    });

    it('should reject booking with conflicting dates', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(mockVehicle as any);
      vi.mocked(prisma.booking.findFirst).mockResolvedValue(mockBooking as any);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: 'vehicle-1',
          startDate: futureDate.toISOString(),
          endDate: endDate.toISOString(),
          pickupLocation: 'Main Office',
          dropoffLocation: 'Main Office',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not available');
    });

    it('should reject booking with end date before start date', async () => {
      const token = await getUserToken();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() - 1); // End before start

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: 'vehicle-1',
          startDate: futureDate.toISOString(),
          endDate: endDate.toISOString(),
          pickupLocation: 'Main Office',
          dropoffLocation: 'Main Office',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('End date must be after');
    });

    it('should reject booking with start date in the past', async () => {
      const token = await getUserToken();

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: 'vehicle-1',
          startDate: pastDate.toISOString(),
          endDate: endDate.toISOString(),
          pickupLocation: 'Main Office',
          dropoffLocation: 'Main Office',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('past');
    });

    it('should return 404 for non-existent vehicle', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: 'non-existent',
          startDate: futureDate.toISOString(),
          endDate: endDate.toISOString(),
          pickupLocation: 'Main Office',
          dropoffLocation: 'Main Office',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/bookings/:id', () => {
    it('should update own pending booking', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'user-1',
        status: 'PENDING',
        vehicle: mockVehicle,
      } as any);

      vi.mocked(prisma.booking.update).mockResolvedValue({
        ...mockBooking,
        pickupLocation: 'New Location',
        vehicle: { id: 'v1', make: 'Toyota', model: 'Camry', year: 2024, images: [] },
        user: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      } as any);

      const response = await request(app)
        .patch('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ pickupLocation: 'New Location' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow customer to update non-pending booking', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'user-1',
        status: 'CONFIRMED', // Not pending
        vehicle: mockVehicle,
      } as any);

      const response = await request(app)
        .patch('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ pickupLocation: 'New Location' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('pending');
    });

    it('should not allow customer to change status', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'user-1',
        status: 'PENDING',
        vehicle: mockVehicle,
      } as any);

      const response = await request(app)
        .patch('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(403);
    });

    it('should allow admin to change status', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        vehicle: mockVehicle,
      } as any);

      vi.mocked(prisma.booking.update).mockResolvedValue({
        ...mockBooking,
        status: 'CONFIRMED',
        vehicle: { id: 'v1', make: 'Toyota', model: 'Camry', year: 2024, images: [] },
        user: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      } as any);

      const response = await request(app)
        .patch('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/bookings/:id/cancel', () => {
    it('should cancel own booking', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'user-1',
        status: 'PENDING',
      } as any);

      vi.mocked(prisma.booking.update).mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED',
        vehicle: { id: 'v1', make: 'Toyota', model: 'Camry', year: 2024 },
      } as any);

      const response = await request(app)
        .post('/api/bookings/booking-1/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('should not cancel completed booking', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'user-1',
        status: 'COMPLETED',
      } as any);

      const response = await request(app)
        .post('/api/bookings/booking-1/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('completed');
    });

    it('should not cancel already cancelled booking', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'user-1',
        status: 'CANCELLED',
      } as any);

      const response = await request(app)
        .post('/api/bookings/booking-1/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already cancelled');
    });

    it('should not allow non-owner to cancel', async () => {
      const token = await getUserToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'other-user', // Different user
        status: 'PENDING',
      } as any);

      const response = await request(app)
        .post('/api/bookings/booking-1/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to cancel any booking', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        userId: 'some-user',
        status: 'CONFIRMED',
      } as any);

      vi.mocked(prisma.booking.update).mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED',
        vehicle: { id: 'v1', make: 'Toyota', model: 'Camry', year: 2024 },
      } as any);

      const response = await request(app)
        .post('/api/bookings/booking-1/cancel')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('should require admin role', async () => {
      const token = await getUserToken();

      const response = await request(app)
        .delete('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('should delete booking as admin', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED',
      } as any);

      vi.mocked(prisma.booking.delete).mockResolvedValue(mockBooking as any);

      const response = await request(app)
        .delete('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should not delete active booking', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        status: 'ACTIVE',
      } as any);

      const response = await request(app)
        .delete('/api/bookings/booking-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('active');
    });
  });
});
