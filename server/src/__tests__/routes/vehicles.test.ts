/**
 * Vehicles API endpoint tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';
import { createTestApp } from '../helpers/app.js';
import prisma from '../../lib/prisma.js';

const app = createTestApp();

// Mock data
const mockVehicle = {
  id: 'vehicle-1',
  make: 'Toyota',
  model: 'Camry',
  year: 2024,
  category: 'STANDARD' as const,
  dailyRate: new Decimal(65),
  status: 'AVAILABLE' as const,
  images: ['https://example.com/car.jpg'],
  features: ['Bluetooth', 'Backup Camera'],
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
  deletedAt: null,
  deletedBy: null,
};

const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  password: '',
  firstName: 'Admin',
  lastName: 'User',
  phone: null,
  role: 'ADMIN' as const,
  emailVerified: true,
  avatarUrl: null,
  stripeCustomerId: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  deletedBy: null,
};

const mockCustomerUser = {
  id: 'customer-user-id',
  email: 'customer@example.com',
  password: '',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  role: 'CUSTOMER' as const,
  emailVerified: true,
  avatarUrl: null,
  stripeCustomerId: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  deletedBy: null,
};

// Helper to get admin token
async function getAdminToken(): Promise<string> {
  const hashedPassword = await bcrypt.hash('adminpassword', 12);
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
    ...mockAdminUser,
    password: hashedPassword,
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'adminpassword' });

  return response.body.data.token;
}

// Helper to get customer token
async function getCustomerToken(): Promise<string> {
  const hashedPassword = await bcrypt.hash('customerpassword', 12);
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
    ...mockCustomerUser,
    password: hashedPassword,
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'customer@example.com', password: 'customerpassword' });

  return response.body.data.token;
}

describe('Vehicles API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/vehicles', () => {
    it('should return list of available vehicles', async () => {
      vi.mocked(prisma.vehicle.count).mockResolvedValue(2);
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([
        {
          ...mockVehicle,
          reviews: [{ rating: 5 }, { rating: 4 }],
          _count: { reviews: 2 },
        },
        {
          ...mockVehicle,
          id: 'vehicle-2',
          make: 'Honda',
          model: 'Accord',
          reviews: [],
          _count: { reviews: 0 },
        },
      ] as any);

      const response = await request(app).get('/api/vehicles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('pageSize');
      expect(response.body.data).toHaveProperty('totalPages');
    });

    it('should filter by category', async () => {
      vi.mocked(prisma.vehicle.count).mockResolvedValue(1);
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([
        {
          ...mockVehicle,
          category: 'SUV',
          reviews: [],
          _count: { reviews: 0 },
        },
      ] as any);

      const response = await request(app)
        .get('/api/vehicles')
        .query({ category: 'SUV' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.vehicle.findMany).toHaveBeenCalled();
    });

    it('should filter by price range', async () => {
      vi.mocked(prisma.vehicle.count).mockResolvedValue(1);
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([
        {
          ...mockVehicle,
          reviews: [],
          _count: { reviews: 0 },
        },
      ] as any);

      const response = await request(app)
        .get('/api/vehicles')
        .query({ minPrice: 50, maxPrice: 100 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should search by make/model', async () => {
      vi.mocked(prisma.vehicle.count).mockResolvedValue(1);
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([
        {
          ...mockVehicle,
          reviews: [],
          _count: { reviews: 0 },
        },
      ] as any);

      const response = await request(app)
        .get('/api/vehicles')
        .query({ search: 'Toyota' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should paginate results', async () => {
      vi.mocked(prisma.vehicle.count).mockResolvedValue(50);
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([
        {
          ...mockVehicle,
          reviews: [],
          _count: { reviews: 0 },
        },
      ] as any);

      const response = await request(app)
        .get('/api/vehicles')
        .query({ page: 2, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.pageSize).toBe(10);
      expect(response.body.data.totalPages).toBe(5);
    });

    it('should sort results', async () => {
      vi.mocked(prisma.vehicle.count).mockResolvedValue(2);
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([
        {
          ...mockVehicle,
          reviews: [],
          _count: { reviews: 0 },
        },
      ] as any);

      const response = await request(app)
        .get('/api/vehicles')
        .query({ sortBy: 'dailyRate', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dailyRate: 'asc' },
        })
      );
    });

    it('should calculate average rating', async () => {
      vi.mocked(prisma.vehicle.count).mockResolvedValue(1);
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([
        {
          ...mockVehicle,
          reviews: [{ rating: 5 }, { rating: 4 }, { rating: 4 }],
          _count: { reviews: 3 },
        },
      ] as any);

      const response = await request(app).get('/api/vehicles');

      expect(response.status).toBe(200);
      // Average of 5, 4, 4 = 4.33
      expect(response.body.data.items[0].averageRating).toBeCloseTo(4.33, 1);
      expect(response.body.data.items[0].reviewCount).toBe(3);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('should return vehicle details', async () => {
      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
        ...mockVehicle,
        reviews: [
          { id: 'r1', rating: 5, comment: 'Great!', user: { id: 'u1', firstName: 'John', lastName: 'Doe' } },
        ],
        _count: { reviews: 1, bookings: 5 },
      } as any);

      const response = await request(app).get('/api/vehicles/vehicle-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('vehicle-1');
      expect(response.body.data.make).toBe('Toyota');
      expect(response.body.data).toHaveProperty('reviews');
      expect(response.body.data).toHaveProperty('averageRating');
    });

    it('should return 404 for non-existent vehicle', async () => {
      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);

      const response = await request(app).get('/api/vehicles/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/vehicles', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send(mockVehicle);

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const customerToken = await getCustomerToken();

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          make: 'Honda',
          model: 'Civic',
          year: 2024,
          category: 'ECONOMY',
          dailyRate: 50,
          seats: 5,
          transmission: 'AUTOMATIC',
          fuelType: 'GASOLINE',
          mileage: 0,
          licensePlate: 'NEW-1234',
          vin: '12345678901234567',
        });

      expect(response.status).toBe(403);
    });

    it('should create vehicle with admin token', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.vehicle.create).mockResolvedValue({
        ...mockVehicle,
        id: 'new-vehicle-id',
      });

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          make: 'Honda',
          model: 'Civic',
          year: 2024,
          category: 'ECONOMY',
          dailyRate: 50,
          seats: 5,
          transmission: 'AUTOMATIC',
          fuelType: 'GASOLINE',
          mileage: 0,
          licensePlate: 'NEW-1234',
          vin: '12345678901234567',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const adminToken = await getAdminToken();

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          make: 'Honda',
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate VIN length', async () => {
      const adminToken = await getAdminToken();

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          make: 'Honda',
          model: 'Civic',
          year: 2024,
          category: 'ECONOMY',
          dailyRate: 50,
          seats: 5,
          transmission: 'AUTOMATIC',
          fuelType: 'GASOLINE',
          mileage: 0,
          licensePlate: 'NEW-1234',
          vin: 'short', // Invalid VIN
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('should update vehicle with admin token', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.vehicle.update).mockResolvedValue({
        ...mockVehicle,
        dailyRate: new Decimal(75),
      });

      const response = await request(app)
        .put('/api/vehicles/vehicle-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dailyRate: 75 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should require admin role', async () => {
      const customerToken = await getCustomerToken();

      const response = await request(app)
        .put('/api/vehicles/vehicle-1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ dailyRate: 75 });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('should delete vehicle without active bookings', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.vehicle.delete).mockResolvedValue(mockVehicle as any);

      const response = await request(app)
        .delete('/api/vehicles/vehicle-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should not delete vehicle with active bookings', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.booking.count).mockResolvedValue(2);

      const response = await request(app)
        .delete('/api/vehicles/vehicle-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('active bookings');
    });

    it('should require admin role', async () => {
      const customerToken = await getCustomerToken();

      const response = await request(app)
        .delete('/api/vehicles/vehicle-1')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/vehicles/:id/status', () => {
    it('should update vehicle status', async () => {
      const adminToken = await getAdminToken();

      vi.mocked(prisma.vehicle.update).mockResolvedValue({
        ...mockVehicle,
        status: 'MAINTENANCE',
      } as any);

      const response = await request(app)
        .patch('/api/vehicles/vehicle-1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'MAINTENANCE' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('MAINTENANCE');
    });

    it('should validate status value', async () => {
      const adminToken = await getAdminToken();

      const response = await request(app)
        .patch('/api/vehicles/vehicle-1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/vehicles/:id/availability', () => {
    it('should return available when no conflicts', async () => {
      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
        status: 'AVAILABLE',
      } as any);

      const response = await request(app)
        .get('/api/vehicles/vehicle-1/availability')
        .query({
          startDate: '2024-03-15',
          endDate: '2024-03-18',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
      expect(response.body.data.conflictingBookings).toBe(0);
    });

    it('should return unavailable when there are conflicts', async () => {
      vi.mocked(prisma.booking.count).mockResolvedValue(1);
      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
        status: 'AVAILABLE',
      } as any);

      const response = await request(app)
        .get('/api/vehicles/vehicle-1/availability')
        .query({
          startDate: '2024-03-15',
          endDate: '2024-03-18',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
      expect(response.body.data.conflictingBookings).toBe(1);
    });

    it('should return unavailable when vehicle is in maintenance', async () => {
      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({
        status: 'MAINTENANCE',
      } as any);

      const response = await request(app)
        .get('/api/vehicles/vehicle-1/availability')
        .query({
          startDate: '2024-03-15',
          endDate: '2024-03-18',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
      expect(response.body.data.vehicleStatus).toBe('MAINTENANCE');
    });

    it('should return 404 for non-existent vehicle', async () => {
      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/vehicles/non-existent/availability')
        .query({
          startDate: '2024-03-15',
          endDate: '2024-03-18',
        });

      expect(response.status).toBe(404);
    });

    it('should require date parameters', async () => {
      const response = await request(app)
        .get('/api/vehicles/vehicle-1/availability');

      expect(response.status).toBe(400);
    });
  });
});
