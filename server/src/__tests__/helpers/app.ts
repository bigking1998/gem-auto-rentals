/**
 * Test app helper
 * Creates an Express app instance for testing without starting the server
 */

import express from 'express';
import cors from 'cors';
import { errorHandler } from '../../middleware/errorHandler.js';
import { notFound } from '../../middleware/notFound.js';
import authRoutes from '../../routes/auth.js';
import vehicleRoutes from '../../routes/vehicles.js';
import bookingRoutes from '../../routes/bookings.js';

export function createTestApp() {
  const app = express();

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use(cors());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/bookings', bookingRoutes);

  // 404 handler
  app.use(notFound);

  // Error handler
  app.use(errorHandler);

  return app;
}
