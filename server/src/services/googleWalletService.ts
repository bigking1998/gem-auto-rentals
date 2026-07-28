/**
 * Google Wallet Service
 *
 * Handles generation of Google Wallet passes for car rental bookings.
 * Passes include QR codes for check-in/check-out at rental locations.
 *
 * Prerequisites (all completed):
 * - Google Cloud Project: gem-car-rentals
 * - Service Account: gem-wallet-service@gem-car-rentals.iam.gserviceaccount.com
 * - Issuer ID: BCR2DN5TT7M3HS3T
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Types
interface BookingPassData {
  bookingId: string;
  confirmationNumber: string;
  customerName: string;
  customerEmail: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: Date;
  endDate: Date;
  status: 'CONFIRMED' | 'ACTIVE' | 'COMPLETED';
}

interface WalletConfig {
  issuerId: string;
  keyFilePath: string;
  classSuffix: string;
}

// Configuration
const config: WalletConfig = {
  issuerId: process.env.GOOGLE_WALLET_ISSUER_ID || '',
  keyFilePath: process.env.GOOGLE_WALLET_KEY_FILE || './google-wallet-key.json',
  classSuffix: process.env.GOOGLE_WALLET_CLASS_SUFFIX || 'rental_pass',
};

// JWT Auth client (lazily initialized)
let authClient: JWT | null = null;

/**
 * Initialize the Google Auth client
 */
function getAuthClient(): JWT {
  if (authClient) {
    return authClient;
  }

  const keyPath = path.resolve(config.keyFilePath);

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Google Wallet key file not found: ${keyPath}`);
  }

  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  authClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });

  return authClient;
}

/**
 * Get the full class ID for rental passes
 */
function getClassId(): string {
  return `${config.issuerId}.${config.classSuffix}`;
}

/**
 * Get a unique object ID for a booking pass
 */
function getObjectId(bookingId: string): string {
  return `${config.issuerId}.booking_${bookingId}`;
}

/**
 * Generate a signed QR code payload for a booking
 * This payload is verified during check-in/check-out scans
 */
export function generateQrPayload(bookingId: string): string {
  const timestamp = Date.now();
  const data = `${bookingId}:${timestamp}`;

  // Create HMAC signature using JWT secret
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);

  return `GEM:${bookingId}:${timestamp}:${signature}`;
}

/**
 * Verify a QR code payload scanned at check-in/check-out
 */
export function verifyQrPayload(payload: string): {
  valid: boolean;
  bookingId?: string;
  error?: string;
} {
  const parts = payload.split(':');

  if (parts.length !== 4 || parts[0] !== 'GEM') {
    return { valid: false, error: 'Invalid QR code format' };
  }

  const [, bookingId, timestamp, signature] = parts;

  // Recreate signature to verify
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const data = `${bookingId}:${timestamp}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
    .substring(0, 16);

  if (signature !== expectedSig) {
    return { valid: false, error: 'Invalid QR code signature' };
  }

  // Check if QR code is not too old (valid for 30 days)
  const qrTimestamp = parseInt(timestamp, 10);
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  if (Date.now() - qrTimestamp > maxAge) {
    return { valid: false, error: 'QR code expired' };
  }

  return { valid: true, bookingId };
}

/**
 * Create or update the Generic Pass class (one-time setup)
 * This defines the template for all rental passes
 */
export async function ensurePassClassExists(): Promise<void> {
  const auth = getAuthClient();
  const walletobjects = google.walletobjects({ version: 'v1', auth });

  const classId = getClassId();

  // Try to get existing class
  try {
    await walletobjects.genericclass.get({ resourceId: classId });
    console.log(`Pass class ${classId} already exists`);
    return;
  } catch (error: any) {
    if (error.code !== 404) {
      throw error;
    }
    // Class doesn't exist, create it
  }

  // Create new class
  const genericClass = {
    id: classId,
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['pickup_date']",
                    },
                  ],
                },
              },
              endItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['return_date']",
                    },
                  ],
                },
              },
            },
          },
          {
            oneItem: {
              item: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['location']",
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  };

  await walletobjects.genericclass.insert({ requestBody: genericClass });
  console.log(`Created pass class ${classId}`);
}

/**
 * Create a Google Wallet pass for a booking
 */
export async function createPass(booking: BookingPassData): Promise<string> {
  const auth = getAuthClient();
  const walletobjects = google.walletobjects({ version: 'v1', auth });

  const objectId = getObjectId(booking.bookingId);
  const qrPayload = generateQrPayload(booking.bookingId);

  // Format dates
  const startDateStr = booking.startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const endDateStr = booking.endDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Determine status label
  let statusLabel = 'CONFIRMED';
  if (booking.status === 'ACTIVE') {
    statusLabel = 'ACTIVE RENTAL';
  } else if (booking.status === 'COMPLETED') {
    statusLabel = 'COMPLETED';
  }

  const genericObject = {
    id: objectId,
    classId: getClassId(),
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#1a1a2e',
    logo: {
      sourceUri: {
        uri: 'https://gemrentalcars.com/logo-icon.png',
      },
    },
    cardTitle: {
      defaultValue: {
        language: 'en',
        value: 'Gem Auto Rentals',
      },
    },
    subheader: {
      defaultValue: {
        language: 'en',
        value: statusLabel,
      },
    },
    header: {
      defaultValue: {
        language: 'en',
        value: `${booking.vehicleYear} ${booking.vehicleMake} ${booking.vehicleModel}`,
      },
    },
    barcode: {
      type: 'QR_CODE',
      value: qrPayload,
      alternateText: booking.confirmationNumber,
    },
    textModulesData: [
      {
        id: 'pickup_date',
        header: 'PICKUP',
        body: startDateStr,
      },
      {
        id: 'return_date',
        header: 'RETURN',
        body: endDateStr,
      },
      {
        id: 'location',
        header: 'LOCATION',
        body: booking.pickupLocation,
      },
      {
        id: 'confirmation',
        header: 'CONFIRMATION',
        body: booking.confirmationNumber,
      },
      {
        id: 'license_plate',
        header: 'LICENSE PLATE',
        body: booking.licensePlate,
      },
    ],
    linksModuleData: {
      uris: [
        {
          id: 'support',
          uri: 'tel:+18134224539',
          description: 'Call Support',
        },
        {
          id: 'website',
          uri: 'https://gemrentalcars.com',
          description: 'Visit Website',
        },
      ],
    },
  };

  // Try to update existing object, or create new one
  try {
    await walletobjects.genericobject.update({
      resourceId: objectId,
      requestBody: genericObject,
    });
    console.log(`Updated pass ${objectId}`);
  } catch (error: any) {
    if (error.code === 404) {
      await walletobjects.genericobject.insert({ requestBody: genericObject });
      console.log(`Created pass ${objectId}`);
    } else {
      throw error;
    }
  }

  // Return the "Add to Google Wallet" URL
  // Load credentials for signing
  const keyPath = path.resolve(config.keyFilePath);
  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: ['https://gemrentalcars.com'],
    payload: {
      genericObjects: [{ id: objectId }],
    },
  };

  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' });
  return `https://pay.google.com/gp/v/save/${token}`;
}

/**
 * Update an existing pass (e.g., status change, date extension)
 */
export async function updatePass(booking: BookingPassData): Promise<void> {
  // createPass handles both create and update
  await createPass(booking);
}

/**
 * Check if the service is properly configured
 */
export function isConfigured(): boolean {
  if (!config.issuerId) {
    console.warn('Google Wallet: GOOGLE_WALLET_ISSUER_ID not set');
    return false;
  }

  const keyPath = path.resolve(config.keyFilePath);
  if (!fs.existsSync(keyPath)) {
    console.warn(`Google Wallet: Key file not found at ${keyPath}`);
    return false;
  }

  return true;
}

export default {
  generateQrPayload,
  verifyQrPayload,
  ensurePassClassExists,
  createPass,
  updatePass,
  isConfigured,
  getObjectId,
};
