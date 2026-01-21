import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Route imports
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import bookingRoutes from './routes/bookings.js';
import customerRoutes from './routes/customers.js';
import paymentRoutes from './routes/payments.js';
import statsRoutes from './routes/stats.js';
import documentRoutes from './routes/documents.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Network Diagnostics on Startup
import { exec } from 'child_process';
const runDiag = (host: string, port: string | number, label: string) => {
  console.log(`DIAG: Testing ${label} (${host}:${port})...`);
  exec(`nc -z -v -w 5 ${host} ${port}`, (err, stdout, stderr) => {
    if (err) console.log(`DIAG: ${label} FALIED:`, stderr || err.message);
    else console.log(`DIAG: ${label} SUCCESS:`, stdout || 'Connection Open');
  });
};

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    runDiag(url.hostname, url.port || 5432, 'DATABASE_URL');
  } catch (e) { console.log('DIAG: Invalid DB URL'); }
}
// Also test known Supabase host directly
runDiag('db.szvnxiozrxmsudtcsddx.supabase.co', 5432, 'DIRECT_HOST_5432');
runDiag('aws-0-us-east-2.pooler.supabase.com', 6543, 'POOLER_HOST_6543');



// Trust proxy - required for rate limiting behind reverse proxies (Render, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.WEB_URL || 'http://localhost:5173',
      process.env.ADMIN_URL || 'http://localhost:5174',
      'https://gemrentalcars.com',
      'https://www.gemrentalcars.com',
      'https://gem-auto-rentals.vercel.app',
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/documents', documentRoutes);

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
