import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { isDatabaseConnected, waitForDatabase } from './lib/prisma.js';

// Route imports
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import bookingRoutes from './routes/bookings.js';
import customerRoutes from './routes/customers.js';
import paymentRoutes from './routes/payments.js';
import statsRoutes from './routes/stats.js';
import documentRoutes from './routes/documents.js';
import favoritesRoutes from './routes/favorites.js';
import abandonmentRoutes from './routes/abandonment.js';
// CRM Feature routes
import sessionRoutes from './routes/sessions.js';
import activityRoutes from './routes/activity.js';
import conversationRoutes from './routes/conversations.js';
import preferencesRoutes from './routes/preferences.js';
import notificationRoutes from './routes/notifications.js';
import invoiceRoutes from './routes/invoices.js';
import integrationRoutes from './routes/integrations.js';
import billingRoutes from './routes/billing.js';
import trashRoutes from './routes/trash.js';
import migrateRoutes from './routes/migrate.js';
import sitemapRoutes from './routes/sitemap.js';
import loyaltyRoutes from './routes/loyalty.js';
import referralRoutes from './routes/referrals.js';
import promoRoutes from './routes/promos.js';
import extensionRoutes from './routes/extensions.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for rate limiting behind reverse proxies (Render, etc.)
app.set('trust proxy', 1);

// Compression middleware - compress all responses
app.use(compression({
  level: 6, // Balanced compression level (1-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't accept it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter to determine if response should be compressed
    return compression.filter(req, res);
  },
}));

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://maps.googleapis.com", "https://*.supabase.co"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://maps.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https://*.stripe.com", "https://maps.gstatic.com", "https://*.supabase.co"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.WEB_URL || 'http://localhost:5173',
      process.env.ADMIN_URL || 'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'https://gemrentalcars.com',
      'https://www.gemrentalcars.com',
      'https://admin.gemrentalcars.com',
    ],
    credentials: true,
  })
);

// Rate limiting - increased for better user experience
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Cache control middleware for API responses
const cacheControl = (maxAge: number) => {
  return (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only cache GET requests
    if (_req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    } else {
      res.set('Cache-Control', 'no-store');
    }
    next();
  };
};

// Health check - checks database connection status
app.get('/health', async (_req, res) => {
  // Check if database is already connected (from startup initialization)
  if (isDatabaseConnected()) {
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    return;
  }

  // Wait for the database initialization to complete
  const connected = await waitForDatabase();
  res.json({
    status: 'ok',
    database: connected ? 'connected' : 'connecting',
    timestamp: new Date().toISOString()
  });
});

// API Routes with cache control
// Vehicles - cacheable for 60 seconds (frequently browsed)
app.use('/api/vehicles', cacheControl(60), vehicleRoutes);

// Auth - no caching (sensitive)
app.use('/api/auth', authRoutes);

// Bookings - no caching (contains mutations and user-specific data)
app.use('/api/bookings', bookingRoutes);

// Customers - no caching (sensitive user data)
app.use('/api/customers', customerRoutes);

// Payments - no caching (sensitive)
app.use('/api/payments', paymentRoutes);

// Stats - cache for 30 seconds (dashboard data)
app.use('/api/stats', cacheControl(30), statsRoutes);

// Documents - no caching (sensitive)
app.use('/api/documents', documentRoutes);

// Favorites - user-specific, no caching
app.use('/api/favorites', favoritesRoutes);

// Abandonment tracking - for recovery emails
app.use('/api/abandonment', abandonmentRoutes);

// CRM Feature routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/settings', preferencesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/bookings', extensionRoutes); // Extension routes under /api/bookings/:id/extend/*

// Sitemap for SEO (served at /sitemap.xml)
app.use('/sitemap.xml', cacheControl(3600), sitemapRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
