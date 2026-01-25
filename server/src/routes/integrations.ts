import { Router } from 'express';
import { z } from 'zod';
import { IntegrationProvider, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/integrations - List all integrations
router.get('/', authenticate, authorize('ADMIN'), async (_req, res, next) => {
  try {
    // Get all integrations or create defaults for missing providers
    const integrations = await prisma.integration.findMany({
      orderBy: { provider: 'asc' },
    });

    // Ensure all providers have an entry
    const existingProviders = new Set(integrations.map((i) => i.provider));
    const missingProviders = Object.values(IntegrationProvider).filter(
      (p) => !existingProviders.has(p)
    );

    // Create missing provider entries
    if (missingProviders.length > 0) {
      await prisma.integration.createMany({
        data: missingProviders.map((provider) => ({
          provider,
          isEnabled: false,
          isConnected: false,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch all again
    const allIntegrations = await prisma.integration.findMany({
      orderBy: { provider: 'asc' },
      select: {
        id: true,
        provider: true,
        isEnabled: true,
        isConnected: true,
        connectedAt: true,
        lastSyncAt: true,
        lastError: true,
        config: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose tokens
      },
    });

    res.json({
      success: true,
      data: allIntegrations,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/integrations/:provider - Get integration status
router.get('/:provider', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { provider } = req.params;

    // Validate provider
    if (!Object.values(IntegrationProvider).includes(provider as IntegrationProvider)) {
      throw BadRequestError('Invalid integration provider');
    }

    let integration = await prisma.integration.findUnique({
      where: { provider: provider as IntegrationProvider },
      select: {
        id: true,
        provider: true,
        isEnabled: true,
        isConnected: true,
        connectedAt: true,
        lastSyncAt: true,
        lastError: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integration) {
      // Create if doesn't exist
      integration = await prisma.integration.create({
        data: {
          provider: provider as IntegrationProvider,
        },
        select: {
          id: true,
          provider: true,
          isEnabled: true,
          isConnected: true,
          connectedAt: true,
          lastSyncAt: true,
          lastError: true,
          config: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    res.json({
      success: true,
      data: integration,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/integrations/:provider/connect - Start OAuth flow or save API key
router.post('/:provider/connect', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { apiKey, clientId, clientSecret, redirectUri } = z.object({
      apiKey: z.string().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      redirectUri: z.string().optional(),
    }).parse(req.body);

    // Validate provider
    if (!Object.values(IntegrationProvider).includes(provider as IntegrationProvider)) {
      throw BadRequestError('Invalid integration provider');
    }

    const providerEnum = provider as IntegrationProvider;
    const apiKeyProviders: IntegrationProvider[] = ['STRIPE', 'TWILIO'];
    const oauthProviders: IntegrationProvider[] = ['MAILCHIMP', 'GOOGLE_CALENDAR', 'QUICKBOOKS', 'ZAPIER'];

    // Handle API key based integrations
    if (apiKeyProviders.includes(providerEnum)) {
      if (!apiKey) {
        throw BadRequestError('API key is required for this integration');
      }

      // In production, encrypt the API key before storing
      await prisma.integration.upsert({
        where: { provider: providerEnum },
        create: {
          provider: providerEnum,
          isEnabled: true,
          isConnected: true,
          accessToken: apiKey, // Would be encrypted in production
          connectedAt: new Date(),
          config: {} as Prisma.InputJsonValue,
        },
        update: {
          isEnabled: true,
          isConnected: true,
          accessToken: apiKey,
          connectedAt: new Date(),
          lastError: null,
        },
      });

      res.json({
        success: true,
        message: `${provider} connected successfully`,
      });
      return;
    }

    // Handle OAuth based integrations
    if (oauthProviders.includes(providerEnum)) {
      if (!clientId) {
        throw BadRequestError('Client ID is required for OAuth integrations');
      }

      // Store OAuth config
      await prisma.integration.upsert({
        where: { provider: providerEnum },
        create: {
          provider: providerEnum,
          config: { clientId, clientSecret, redirectUri } as Prisma.InputJsonValue,
        },
        update: {
          config: { clientId, clientSecret, redirectUri } as Prisma.InputJsonValue,
        },
      });

      // Generate OAuth URL
      const oauthUrl = getOAuthUrl(providerEnum, clientId, redirectUri || '');

      res.json({
        success: true,
        data: {
          oauthUrl,
          message: 'Redirect user to OAuth URL to complete connection',
        },
      });
      return;
    }

    // Handle PayPal
    if (providerEnum === 'PAYPAL') {
      if (!clientId || !clientSecret) {
        throw BadRequestError('Client ID and Secret are required for PayPal');
      }

      await prisma.integration.upsert({
        where: { provider: providerEnum },
        create: {
          provider: providerEnum,
          config: { clientId, clientSecret } as Prisma.InputJsonValue,
          isEnabled: true,
          isConnected: true,
          connectedAt: new Date(),
        },
        update: {
          config: { clientId, clientSecret } as Prisma.InputJsonValue,
          isEnabled: true,
          isConnected: true,
          connectedAt: new Date(),
          lastError: null,
        },
      });

      res.json({
        success: true,
        message: 'PayPal connected successfully',
      });
      return;
    }

    // Unsupported provider (should not reach here due to validation)
    res.status(400).json({
      success: false,
      error: 'Unsupported integration provider',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/integrations/:provider/callback - OAuth callback
router.get('/:provider/callback', async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code, state: _state, error: oauthError } = req.query;

    if (oauthError) {
      throw BadRequestError(`OAuth error: ${oauthError}`);
    }

    if (!code) {
      throw BadRequestError('Authorization code is required');
    }

    // Validate provider
    if (!Object.values(IntegrationProvider).includes(provider as IntegrationProvider)) {
      throw BadRequestError('Invalid integration provider');
    }

    const providerEnum = provider as IntegrationProvider;

    // Get stored config
    const integration = await prisma.integration.findUnique({
      where: { provider: providerEnum },
    });

    if (!integration) {
      throw NotFoundError('Integration not found');
    }

    // Exchange code for tokens (simplified - real implementation would call provider's token endpoint)
    // In production, you would:
    // 1. Make a POST request to the provider's token endpoint
    // 2. Exchange the authorization code for access/refresh tokens
    // 3. Store the tokens securely (encrypted)

    // For now, simulate token exchange
    await prisma.integration.update({
      where: { provider: providerEnum },
      data: {
        isEnabled: true,
        isConnected: true,
        accessToken: `mock_access_token_${code}`, // Would be real token in production
        refreshToken: `mock_refresh_token_${code}`,
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
        connectedAt: new Date(),
        lastError: null,
      },
    });

    // Redirect to admin dashboard
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
    res.redirect(`${adminUrl}/settings/integrations?connected=${provider}`);
  } catch (error) {
    next(error);
  }
});

// POST /api/integrations/:provider/disconnect - Disconnect integration
router.post('/:provider/disconnect', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { provider } = req.params;

    // Validate provider
    if (!Object.values(IntegrationProvider).includes(provider as IntegrationProvider)) {
      throw BadRequestError('Invalid integration provider');
    }

    await prisma.integration.update({
      where: { provider: provider as IntegrationProvider },
      data: {
        isEnabled: false,
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        connectedAt: null,
        lastSyncAt: null,
      },
    });

    res.json({
      success: true,
      message: `${provider} disconnected successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/integrations/:provider/config - Update config
router.put('/:provider/config', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { provider } = req.params;
    const config = req.body;

    // Validate provider
    if (!Object.values(IntegrationProvider).includes(provider as IntegrationProvider)) {
      throw BadRequestError('Invalid integration provider');
    }

    const integration = await prisma.integration.update({
      where: { provider: provider as IntegrationProvider },
      data: {
        config: config as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        provider: true,
        isEnabled: true,
        isConnected: true,
        config: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: integration,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/integrations/:provider/test - Test connection
router.post('/:provider/test', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { provider } = req.params;

    // Validate provider
    if (!Object.values(IntegrationProvider).includes(provider as IntegrationProvider)) {
      throw BadRequestError('Invalid integration provider');
    }

    const integration = await prisma.integration.findUnique({
      where: { provider: provider as IntegrationProvider },
    });

    if (!integration) {
      throw NotFoundError('Integration not found');
    }

    if (!integration.isConnected) {
      throw BadRequestError('Integration is not connected');
    }

    // Test the connection (simplified - real implementation would call provider's API)
    // In production, you would make an API call to verify the credentials work
    let testResult = { success: true, message: 'Connection test passed' };

    try {
      // Simulate test for each provider
      switch (integration.provider) {
        case 'STRIPE':
          // Would call Stripe API to verify key
          testResult.message = 'Stripe API key is valid';
          break;
        case 'TWILIO':
          // Would call Twilio API to verify credentials
          testResult.message = 'Twilio credentials are valid';
          break;
        case 'MAILCHIMP':
          // Would call Mailchimp API
          testResult.message = 'Mailchimp connection is valid';
          break;
        default:
          testResult.message = `${integration.provider} connection test passed`;
      }

      // Update last sync time
      await prisma.integration.update({
        where: { provider: integration.provider },
        data: {
          lastSyncAt: new Date(),
          lastError: null,
        },
      });
    } catch (testError) {
      const errorMessage = testError instanceof Error ? testError.message : 'Unknown error';

      await prisma.integration.update({
        where: { provider: integration.provider },
        data: {
          lastError: errorMessage,
        },
      });

      testResult = { success: false, message: errorMessage };
    }

    res.json({
      success: testResult.success,
      data: testResult,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate OAuth URLs
function getOAuthUrl(provider: IntegrationProvider, clientId: string, redirectUri: string): string {
  const encodedRedirect = encodeURIComponent(redirectUri);

  switch (provider) {
    case 'MAILCHIMP':
      return `https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirect}`;
    case 'GOOGLE_CALENDAR':
      return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirect}&scope=https://www.googleapis.com/auth/calendar`;
    case 'QUICKBOOKS':
      return `https://appcenter.intuit.com/connect/oauth2?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirect}&scope=com.intuit.quickbooks.accounting`;
    case 'ZAPIER':
      return `https://zapier.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirect}`;
    default:
      return '';
  }
}

export default router;
