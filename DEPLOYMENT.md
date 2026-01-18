# Gem Auto Rentals - Deployment Guide

This guide covers deploying the Gem Auto Rentals application to production environments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (Cloudflare)                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Web App   │   │  Admin App  │   │   API       │
│  (Vercel/   │   │  (Vercel/   │   │  (Railway/  │
│  Netlify)   │   │  Netlify)   │   │  Render)    │
└─────────────┘   └─────────────┘   └──────┬──────┘
                                           │
                                           ▼
                              ┌────────────────────┐
                              │   PostgreSQL       │
                              │   (Supabase/       │
                              │   Railway/Neon)    │
                              └────────────────────┘
```

**Components:**
- **Web App** (`apps/web`): Customer-facing React SPA
- **Admin App** (`apps/admin`): Admin dashboard React SPA
- **API Server** (`server`): Express.js REST API
- **Database**: PostgreSQL with Prisma ORM

---

## Prerequisites

- Node.js 18.x or higher
- pnpm 8.x or higher
- PostgreSQL 14+ database
- Stripe account (for payments)
- Domain name (recommended)

### Accounts Needed

| Service | Purpose | Required |
|---------|---------|----------|
| [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Frontend hosting | Yes |
| [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io) | Backend hosting | Yes |
| [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app) | PostgreSQL database | Yes |
| [Stripe](https://stripe.com) | Payment processing | Yes |
| [Cloudflare](https://cloudflare.com) | DNS & CDN | Recommended |
| [Sentry](https://sentry.io) | Error tracking | Recommended |

---

## Environment Setup

### Server Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@host:5432/gem_auto_rentals?schema=public"

# JWT
JWT_SECRET="your-256-bit-secret-key-here"
JWT_EXPIRES_IN="7d"

# CORS
WEB_URL="https://gemautorentals.com"
ADMIN_URL="https://admin.gemautorentals.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Optional: Email (for password reset)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
FROM_EMAIL="noreply@gemautorentals.com"
```

### Web App Environment Variables

Create a `.env` file in `apps/web`:

```env
VITE_API_URL="https://api.gemautorentals.com"
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### Admin App Environment Variables

Create a `.env` file in `apps/admin`:

```env
VITE_API_URL="https://api.gemautorentals.com"
```

### Generate Secure JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

---

## Database Setup

### Option 1: Supabase (Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > Database** to find your connection string
3. Use the connection string in `DATABASE_URL`

### Option 2: Railway

1. Create a new project at [railway.app](https://railway.app)
2. Add a PostgreSQL database
3. Copy the `DATABASE_URL` from variables

### Option 3: Neon

1. Create a new project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard

### Run Migrations

```bash
# Install dependencies
cd server
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed initial data (optional)
pnpm prisma db seed
```

---

## Backend Deployment

### Option 1: Railway

1. Connect your GitHub repository to Railway
2. Create a new service from the `server` directory
3. Add environment variables in the Railway dashboard
4. Railway will auto-detect the Node.js app

**railway.toml** (optional, for custom config):
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
```

### Option 2: Render

1. Create a new **Web Service** at [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `pnpm install && pnpm prisma generate`
   - **Start Command**: `pnpm start`
4. Add environment variables

### Option 3: Fly.io

1. Install the Fly CLI: `brew install flyctl`
2. Create `fly.toml` in the `server` directory:

```toml
app = "gem-auto-rentals-api"
primary_region = "ord"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[services.http_checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "GET"
  path = "/health"
```

3. Deploy:
```bash
cd server
flyctl launch
flyctl secrets set DATABASE_URL="..." JWT_SECRET="..." STRIPE_SECRET_KEY="..."
flyctl deploy
```

### Docker Deployment

**Dockerfile** for the server:

```dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/server
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/package.json ./

USER expressjs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. Import your GitHub repository to [vercel.com](https://vercel.com)
2. Configure the project:

**Web App:**
- **Root Directory**: `apps/web`
- **Framework Preset**: Vite
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`

**Admin App:**
- Create a separate Vercel project
- **Root Directory**: `apps/admin`
- Same settings as above

3. Add environment variables in Vercel dashboard
4. Configure custom domain if needed

### Option 2: Netlify

1. Import your GitHub repository to [netlify.com](https://netlify.com)
2. Configure build settings:

**netlify.toml** (in `apps/web`):
```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. Add environment variables in Site Settings

### Option 3: Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Configure:
   - **Build command**: `pnpm --filter web build`
   - **Build output directory**: `apps/web/dist`
3. Add environment variables

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linting
        run: pnpm lint

      - name: Run type checking
        run: pnpm typecheck

      - name: Run tests
        run: pnpm test

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      # Railway deployment
      - name: Deploy to Railway
        uses: railwayapp/railway-github-actions@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: api

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      # Vercel deployment (handled automatically via Vercel GitHub integration)
      # Or use Vercel CLI:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_WEB }}
          working-directory: apps/web
```

---

## Monitoring & Logging

### Application Monitoring with Sentry

1. Create a project at [sentry.io](https://sentry.io)
2. Install Sentry in the server:

```bash
cd server
pnpm add @sentry/node
```

3. Initialize in `server/src/index.ts`:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Add error handler before other error handlers
app.use(Sentry.Handlers.errorHandler());
```

4. Add to frontend apps as well (see Sentry React docs)

### Health Checks

The API includes a health endpoint at `/health`:

```bash
curl https://api.gemautorentals.com/health
# Response: {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Logging

Configure structured logging with Winston or Pino:

```bash
cd server
pnpm add pino pino-pretty
```

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets stored in environment variables
- [ ] JWT secret is at least 256 bits
- [ ] Database credentials are secure
- [ ] CORS origins are properly configured
- [ ] Rate limiting is enabled

### SSL/TLS

- [ ] All traffic uses HTTPS
- [ ] HSTS headers enabled
- [ ] SSL certificate is valid

### Database

- [ ] Connection string uses SSL (`?sslmode=require`)
- [ ] Database user has minimal required permissions
- [ ] Regular backups are configured

### API Security

- [ ] Helmet.js middleware is enabled
- [ ] Rate limiting is configured
- [ ] Input validation on all endpoints
- [ ] Authentication required for sensitive endpoints
- [ ] Admin endpoints restricted to staff roles

### Stripe

- [ ] Using live API keys in production
- [ ] Webhook endpoint is secured with signature verification
- [ ] PCI compliance requirements met

### Headers Configuration

Ensure these security headers are set (via Helmet.js):

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      frameSrc: ["https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Stripe
}));
```

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

```
Error: P1001: Can't reach database server
```

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check if database allows external connections
3. Add your IP to database firewall rules
4. Ensure SSL is enabled: `?sslmode=require`

#### CORS Errors

```
Access to fetch has been blocked by CORS policy
```

**Solutions:**
1. Verify `WEB_URL` and `ADMIN_URL` in server env
2. Ensure no trailing slashes in URLs
3. Check that credentials are included in CORS config

#### Stripe Webhook Failures

**Solutions:**
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Ensure webhook endpoint receives raw body
3. Check Stripe Dashboard > Webhooks for error logs

#### Build Failures

```
Module not found: @gem-auto-rentals/types
```

**Solutions:**
1. Ensure `pnpm install` runs at monorepo root
2. Check that workspace packages are properly linked
3. Verify `turbo.json` includes build dependencies

### Useful Commands

```bash
# Check server logs (Railway)
railway logs

# Check server logs (Fly.io)
flyctl logs

# SSH into running container (Fly.io)
flyctl ssh console

# Run database migrations
pnpm --filter server prisma migrate deploy

# Check database status
pnpm --filter server prisma migrate status
```

### Performance Optimization

1. **Enable compression**: Already configured via Express
2. **Use CDN**: Configure Cloudflare for static assets
3. **Database indexing**: Prisma migrations include indexes
4. **Caching**: API caching implemented in frontend
5. **Connection pooling**: Configure in Prisma:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // For serverless environments:
  // directUrl = env("DIRECT_DATABASE_URL")
}
```

---

## Support

For deployment assistance or issues:
- Open an issue on GitHub
- Contact: support@gemautorentals.com

---

*Last updated: January 2024*
