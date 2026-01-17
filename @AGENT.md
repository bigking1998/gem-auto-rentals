# Gem Auto Rentals - Agent Build Instructions

## Project Overview
Full-stack car rental platform with:
- Customer-facing website (React + Vite)
- Admin CRM dashboard (React + Vite)
- Backend API (Express.js + Prisma)

## Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js 20+, Express.js, Prisma, PostgreSQL
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## Project Structure
```
/gem-auto-rentals
├── /apps
│   ├── /web          # Customer frontend
│   └── /admin        # Admin dashboard
├── /packages
│   ├── /ui           # Shared shadcn/ui components
│   ├── /types        # Shared TypeScript types
│   └── /utils        # Shared utilities
├── /server           # Express.js backend
│   ├── /src
│   │   ├── /routes
│   │   ├── /controllers
│   │   ├── /services
│   │   ├── /middleware
│   │   └── /prisma
├── package.json      # Workspace root
├── pnpm-workspace.yaml
└── turbo.json
```

## Project Setup

### Prerequisites
```bash
# Install Node.js 20+ LTS
# Install pnpm globally
npm install -g pnpm

# Install PostgreSQL 15+ (or use Docker)
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
```

### Installation
```bash
# Install all dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, JWT secret, etc.

# Run database migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed
```

## Development Server

### Start All Services
```bash
# Start all apps and server in development mode
pnpm dev
```

### Start Individual Services
```bash
# Customer website (port 5173)
pnpm --filter web dev

# Admin dashboard (port 5174)
pnpm --filter admin dev

# Backend API (port 3000)
pnpm --filter server dev
```

## Build Commands

### Development Build
```bash
pnpm build
```

### Production Build
```bash
pnpm build:prod
```

### Individual Builds
```bash
pnpm --filter web build
pnpm --filter admin build
pnpm --filter server build
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Individual Test Suites
```bash
# Frontend tests
pnpm --filter web test
pnpm --filter admin test

# Backend tests
pnpm --filter server test

# E2E tests
pnpm test:e2e
```

### Coverage
```bash
pnpm test:coverage
```

## Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Reset database (caution: deletes all data)
pnpm db:reset

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed
```

## Linting & Formatting

```bash
# Lint all files
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm typecheck
```

## Key Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gem_auto_rentals"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (SendGrid)
SENDGRID_API_KEY="SG...."

# Frontend URLs
VITE_API_URL="http://localhost:3000/api"
```

## Key Learnings

### shadcn/ui Setup
- Run `npx shadcn-ui@latest init` in packages/ui
- Components go in packages/ui/src/components
- Export from packages/ui/src/index.ts
- Import in apps as `import { Button } from '@gem/ui'`

### Turborepo Caching
- Build artifacts are cached automatically
- Use `pnpm turbo run build --force` to bypass cache
- Remote caching available with Vercel

### Database
- Always run `pnpm db:generate` after schema changes
- Use transactions for multi-step operations
- Index frequently queried fields

## Feature Development Quality Standards

### Testing Requirements
- **Minimum Coverage**: 80% for new code
- **Test Pass Rate**: 100% - all tests must pass
- **Test Types**: Unit, Integration, E2E for critical flows

### Git Workflow
1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit with conventional commits
3. Push and create PR
4. Merge after review

### Feature Completion Checklist
- [ ] All tests pass
- [ ] Code coverage meets threshold
- [ ] Lint and type checks pass
- [ ] Responsive design tested
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] @fix_plan.md updated
- [ ] Changes committed and pushed

## Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Out of Sync
```bash
pnpm db:generate
```

### Node Modules Issues
```bash
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

## Deployment

### Frontend (Vercel)
- Connect GitHub repo
- Build command: `pnpm --filter web build`
- Output directory: `apps/web/dist`

### Backend (Railway/Render)
- Build command: `pnpm --filter server build`
- Start command: `pnpm --filter server start`
- Set environment variables

### Database (Supabase/Neon)
- Create PostgreSQL database
- Update DATABASE_URL
- Run migrations: `pnpm db:migrate`
