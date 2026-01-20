# Gem Auto Rentals - Implementation Plan

## Executive Summary

This document outlines the comprehensive plan to transition Gem Auto Rentals from prototype/mock mode to a fully functional production-ready application.

**Current State:** Frontend apps (Web + Admin) are using hardcoded mock data. Backend API exists but is not connected. Database schema is ready but not deployed.

**Target State:** Fully integrated full-stack application with real authentication, live database, payment processing, and proper error handling.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                                  │
├─────────────────────────────┬───────────────────────────────────────┤
│   Customer Web App          │         Admin Dashboard               │
│   (localhost:5173)          │         (localhost:5174)              │
│   - React + TypeScript      │         - React + TypeScript          │
│   - Zustand State           │         - Zustand State               │
│   - TailwindCSS             │         - TailwindCSS                 │
└─────────────────────────────┴───────────────────────────────────────┘
                                    │
                              API Calls
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER TIER                                  │
│                    Express.js (localhost:3000)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Routes: /api/auth, /api/vehicles, /api/bookings,                   │
│          /api/customers, /api/payments, /api/stats                  │
│  Middleware: JWT Auth, CORS, Helmet, Rate Limiting                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                              Prisma ORM
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA TIER                                    │
│                    PostgreSQL (Supabase)                             │
├─────────────────────────────────────────────────────────────────────┤
│  Tables: User, Vehicle, Booking, Payment, Document,                 │
│          Review, MaintenanceRecord                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database & Backend Foundation

### 1.1 Database Setup
**Priority:** CRITICAL | **Status:** Ready to Execute

The Prisma schema is complete. We need to ensure the database is properly synced.

**Tasks:**
- [ ] Verify Supabase database connection string in `.env`
- [ ] Run `pnpm db:push` to sync Prisma schema to database
- [ ] Run `pnpm db:seed` to populate initial data (admin user, test vehicles)
- [ ] Verify tables created: User, Vehicle, Booking, Payment, Document, Review, MaintenanceRecord

**Files Involved:**
- `server/prisma/schema.prisma` - Database schema
- `server/prisma/seed.ts` - Seed data script
- `server/.env` - Database connection string

**Verification:**
```bash
cd server
pnpm db:push
pnpm db:seed
pnpm prisma studio  # Visual database browser
```

### 1.2 Backend API Verification
**Priority:** CRITICAL | **Status:** Already Built - Needs Testing

The Express backend is fully implemented with 6 route modules.

**Existing API Endpoints:**

| Route Module | Endpoints | Status |
|--------------|-----------|--------|
| `/api/auth` | register, login, logout, me, forgot-password | ✅ Complete |
| `/api/vehicles` | CRUD + availability check | ✅ Complete |
| `/api/bookings` | CRUD + status management | ✅ Complete |
| `/api/customers` | list, get, update, profile | ✅ Complete |
| `/api/payments` | create-intent, confirm | ⚠️ Partial |
| `/api/stats` | dashboard, revenue, fleet, bookings, customers | ✅ Complete |

**Tasks:**
- [ ] Start backend server: `cd server && pnpm dev`
- [ ] Test auth endpoints with Postman/curl
- [ ] Test vehicles endpoints
- [ ] Verify JWT token generation and validation
- [ ] Test role-based access control (admin vs customer)

**Files Involved:**
- `server/src/index.ts` - Server entry point
- `server/src/routes/*.ts` - All route handlers
- `server/src/middleware/*.ts` - Auth and error handling

---

## Phase 2: Customer Web App Integration

### 2.1 API Client Setup
**Priority:** HIGH | **Status:** Needs Implementation

Create a centralized API client to replace all mock data calls.

**Tasks:**
- [ ] Review/update existing `apps/web/src/lib/api.ts`
- [ ] Add proper error handling with typed responses
- [ ] Add request/response interceptors for auth tokens
- [ ] Add loading state management

**New API Client Structure:**
```typescript
// apps/web/src/lib/api.ts
const api = {
  auth: {
    login: (email, password) => POST('/api/auth/login', { email, password }),
    register: (data) => POST('/api/auth/register', data),
    logout: () => POST('/api/auth/logout'),
    me: () => GET('/api/auth/me'),
  },
  vehicles: {
    list: (filters) => GET('/api/vehicles', filters),
    get: (id) => GET(`/api/vehicles/${id}`),
    checkAvailability: (id, dates) => GET(`/api/vehicles/${id}/availability`, dates),
  },
  bookings: {
    list: () => GET('/api/bookings'),
    get: (id) => GET(`/api/bookings/${id}`),
    create: (data) => POST('/api/bookings', data),
    cancel: (id) => POST(`/api/bookings/${id}/cancel`),
  },
  payments: {
    createIntent: (data) => POST('/api/payments/create-intent', data),
    confirm: (data) => POST('/api/payments/confirm', data),
  },
}
```

### 2.2 Authentication Integration
**Priority:** HIGH | **Status:** Needs Implementation

Replace simulated auth with real backend calls.

**Files to Update:**
- `apps/web/src/stores/authStore.ts` - Auth state management
- `apps/web/src/pages/auth/LoginPage.tsx` - Login form
- `apps/web/src/pages/auth/RegisterPage.tsx` - Registration form
- `apps/web/src/pages/auth/ForgotPasswordPage.tsx` - Password reset request

**Tasks:**
- [ ] Update `authStore.ts` to use real API calls instead of setTimeout mocks
- [ ] Implement JWT token storage in localStorage/cookies
- [ ] Add auth token to all API requests via interceptor
- [ ] Add auth state persistence across page refreshes
- [ ] Implement logout (clear tokens, redirect)
- [ ] Add protected route wrapper component

**Auth Flow:**
```
Login → API /auth/login → Store JWT → Redirect to Dashboard
Register → API /auth/register → Store JWT → Redirect to Dashboard
Page Load → Check stored JWT → Validate with /auth/me → Set user state
Logout → Clear JWT → Redirect to Home
```

### 2.3 Vehicles Page Integration
**Priority:** HIGH | **Status:** Needs Implementation

Replace `mockVehicles` array with real API data.

**Files to Update:**
- `apps/web/src/pages/VehiclesPage.tsx` - Main vehicles listing
- `apps/web/src/pages/VehicleDetailPage.tsx` - Single vehicle view
- `apps/web/src/components/home/FeaturedVehicles.tsx` - Homepage featured section

**Tasks:**
- [ ] Remove `mockVehicles` array from VehiclesPage.tsx
- [ ] Add React Query or useEffect to fetch from `/api/vehicles`
- [ ] Pass filter parameters to API (category, priceRange, search, etc.)
- [ ] Update FeaturedVehicles to fetch featured vehicles from API
- [ ] Add loading skeletons during data fetch
- [ ] Add error states for failed fetches
- [ ] Implement vehicle availability checking

**Data Flow:**
```
Page Load → Fetch /api/vehicles?category=SUV&limit=10 → Display Grid
Filter Change → Update URL params → Re-fetch with new filters
Vehicle Click → Navigate to /vehicles/:id → Fetch single vehicle
```

### 2.4 Booking Flow Integration
**Priority:** HIGH | **Status:** Needs Implementation

Connect the multi-step booking form to the backend.

**Files to Update:**
- `apps/web/src/pages/BookingPage.tsx` - Booking form container
- `apps/web/src/stores/bookingStore.ts` - Booking state
- `apps/web/src/components/booking/*.tsx` - Step components

**Booking Steps:**
1. **DateLocation** - Select dates and pickup/dropoff locations
2. **Extras** - Add insurance, GPS, child seats, etc.
3. **CustomerInfo** - Enter/confirm customer details
4. **Documents** - Upload driver's license, ID
5. **Payment** - Process payment via Stripe

**Tasks:**
- [ ] Connect Step 1 to vehicle availability API
- [ ] Calculate total price on server (prevent client-side manipulation)
- [ ] Create booking record on Step 5 submission
- [ ] Integrate Stripe payment flow
- [ ] Handle payment success/failure
- [ ] Send confirmation email (via backend)
- [ ] Redirect to confirmation page with booking ID

### 2.5 Customer Dashboard Integration
**Priority:** MEDIUM | **Status:** Needs Implementation

Connect customer dashboard pages to real data.

**Files to Update:**
- `apps/web/src/pages/dashboard/MyBookingsPage.tsx` - Booking history
- `apps/web/src/pages/dashboard/ProfilePage.tsx` - Profile management
- `apps/web/src/pages/dashboard/DocumentsPage.tsx` - Document uploads
- `apps/web/src/pages/dashboard/PaymentMethodsPage.tsx` - Saved cards

**Tasks:**
- [ ] Fetch user's bookings from `/api/bookings`
- [ ] Display booking status, dates, vehicle info
- [ ] Allow booking cancellation (with policy enforcement)
- [ ] Load and update profile from `/api/customers/profile`
- [ ] Implement document upload to storage (S3/Supabase)
- [ ] Integrate Stripe for saved payment methods

---

## Phase 3: Admin Dashboard Integration

### 3.1 Admin Authentication
**Priority:** CRITICAL | **Status:** Needs Implementation

Admin dashboard currently has no proper auth protection.

**Files to Update:**
- `apps/admin/src/pages/LoginPage.tsx` - Admin login
- `apps/admin/src/stores/authStore.ts` - Auth state
- `apps/admin/src/App.tsx` - Route protection

**Tasks:**
- [ ] Implement admin login with role verification
- [ ] Add PrivateRoute component to protect all admin routes
- [ ] Verify user has ADMIN, MANAGER, or SUPPORT role
- [ ] Redirect unauthorized users to login
- [ ] Add session timeout handling

**Role-Based Access:**
```
ADMIN    - Full access to all features
MANAGER  - Fleet, bookings, customers, analytics (no security settings)
SUPPORT  - View bookings, customers, respond to messages
CUSTOMER - No admin access (redirect to customer site)
```

### 3.2 Admin API Client
**Priority:** HIGH | **Status:** Needs Implementation

Create admin-specific API client with elevated permissions.

**Tasks:**
- [ ] Create `apps/admin/src/lib/api.ts`
- [ ] Include all customer endpoints plus admin-only endpoints
- [ ] Add role-based endpoint access
- [ ] Handle 403 Forbidden responses gracefully

**Admin-Specific Endpoints:**
```typescript
api.admin = {
  // Vehicle Management
  vehicles: {
    create: (data) => POST('/api/vehicles', data),
    update: (id, data) => PUT(`/api/vehicles/${id}`, data),
    delete: (id) => DELETE(`/api/vehicles/${id}`),
    updateStatus: (id, status) => PATCH(`/api/vehicles/${id}/status`, { status }),
  },
  // Customer Management
  customers: {
    list: (filters) => GET('/api/customers', filters),
    get: (id) => GET(`/api/customers/${id}`),
    update: (id, data) => PUT(`/api/customers/${id}`, data),
  },
  // Analytics
  stats: {
    dashboard: () => GET('/api/stats/dashboard'),
    revenue: (period) => GET(`/api/stats/revenue?period=${period}`),
    fleet: () => GET('/api/stats/fleet'),
    bookings: () => GET('/api/stats/bookings'),
    customers: () => GET('/api/stats/customers'),
  },
}
```

### 3.3 Dashboard Home Integration
**Priority:** HIGH | **Status:** Needs Implementation

Replace mock stats with real analytics data.

**File:** `apps/admin/src/pages/DashboardHome.tsx`

**Tasks:**
- [ ] Fetch dashboard stats from `/api/stats/dashboard`
- [ ] Display real KPIs: total bookings, revenue, active rentals, new customers
- [ ] Show recent bookings list
- [ ] Add revenue chart with real data
- [ ] Implement date range filtering

**Dashboard Metrics:**
- Total Revenue (period)
- Active Rentals
- Pending Bookings
- Fleet Utilization %
- New Customers (period)
- Recent Bookings Table

### 3.4 Fleet Management Integration
**Priority:** HIGH | **Status:** Needs Implementation

Connect fleet management to real vehicle CRUD.

**File:** `apps/admin/src/pages/FleetManagement.tsx`

**Tasks:**
- [ ] Remove `initialVehicles` mock data
- [ ] Fetch vehicles from `/api/vehicles`
- [ ] Implement Add Vehicle modal → POST `/api/vehicles`
- [ ] Implement Edit Vehicle modal → PUT `/api/vehicles/:id`
- [ ] Implement Delete confirmation → DELETE `/api/vehicles/:id`
- [ ] Add vehicle status toggle (available/maintenance/retired)
- [ ] Implement image upload for vehicle photos
- [ ] Add maintenance record tracking

### 3.5 Bookings Management Integration
**Priority:** HIGH | **Status:** Needs Implementation

**File:** `apps/admin/src/pages/BookingsPage.tsx`

**Tasks:**
- [ ] Fetch all bookings from `/api/bookings`
- [ ] Implement status filters (pending, confirmed, active, completed, cancelled)
- [ ] Add booking detail modal with full information
- [ ] Implement status updates (confirm, start, complete, cancel)
- [ ] Add payment tracking integration
- [ ] Implement booking search by customer name, vehicle, dates

### 3.6 Customer Management Integration
**Priority:** MEDIUM | **Status:** Needs Implementation

**Files:**
- `apps/admin/src/pages/CustomersPage.tsx`
- `apps/admin/src/pages/CustomerProfilePage.tsx`

**Tasks:**
- [ ] Fetch customers from `/api/customers`
- [ ] Display customer list with search and filters
- [ ] Show customer profile with booking history
- [ ] Allow customer status updates (active/suspended)
- [ ] View customer documents
- [ ] Add notes/comments on customer records

### 3.7 Analytics Integration
**Priority:** MEDIUM | **Status:** Needs Implementation

**File:** `apps/admin/src/pages/AnalyticsPage.tsx`

**Tasks:**
- [ ] Fetch revenue data from `/api/stats/revenue`
- [ ] Implement period selector (7d, 30d, 90d, 365d)
- [ ] Display revenue trends chart
- [ ] Show fleet utilization metrics
- [ ] Add booking trends analysis
- [ ] Implement export to CSV/PDF

---

## Phase 4: Payment Integration

### 4.1 Stripe Setup
**Priority:** HIGH | **Status:** Partial

**Tasks:**
- [ ] Verify Stripe API keys in `server/.env`
- [ ] Complete `/api/payments/create-intent` endpoint
- [ ] Implement `/api/payments/confirm` endpoint
- [ ] Set up Stripe webhook endpoint for async events
- [ ] Handle payment_intent.succeeded webhook
- [ ] Handle payment_intent.failed webhook

### 4.2 Customer Payment Flow
**Priority:** HIGH | **Status:** Needs Implementation

**Tasks:**
- [ ] Integrate Stripe Elements in booking payment step
- [ ] Create payment intent when user reaches payment step
- [ ] Collect card details securely via Stripe
- [ ] Handle 3D Secure authentication
- [ ] Update booking status on successful payment
- [ ] Show payment confirmation

### 4.3 Admin Payment Tracking
**Priority:** MEDIUM | **Status:** Needs Implementation

**Tasks:**
- [ ] Display payment status in booking details
- [ ] Implement refund functionality
- [ ] Add payment history view
- [ ] Generate payment receipts

---

## Phase 5: File Storage & Documents

### 5.1 Storage Setup
**Priority:** MEDIUM | **Status:** Not Started

**Options:**
1. **Supabase Storage** (Recommended - already have Supabase)
2. **AWS S3** (Keys configured in .env)
3. **Cloudinary** (Good for image optimization)

**Tasks:**
- [ ] Choose storage provider
- [ ] Configure storage bucket/container
- [ ] Set up access policies (private for documents, public for vehicle images)
- [ ] Create upload endpoints in backend

### 5.2 Document Upload (Customer)
**Priority:** MEDIUM | **Status:** Needs Implementation

**Tasks:**
- [ ] Implement file upload component
- [ ] Add file type validation (images, PDFs)
- [ ] Add file size limits
- [ ] Upload to storage, save URL in database
- [ ] Display uploaded documents in dashboard

### 5.3 Vehicle Images (Admin)
**Priority:** MEDIUM | **Status:** Needs Implementation

**Tasks:**
- [ ] Add image upload to vehicle create/edit modal
- [ ] Support multiple images per vehicle
- [ ] Implement image reordering
- [ ] Add image optimization on upload

---

## Phase 6: Email Notifications

### 6.1 SendGrid Setup
**Priority:** MEDIUM | **Status:** Not Started

**Tasks:**
- [ ] Verify SendGrid API key in `server/.env`
- [ ] Create email templates:
  - Booking confirmation
  - Payment receipt
  - Booking reminder (24h before)
  - Booking completion
  - Password reset
- [ ] Implement email service in backend

### 6.2 Notification Triggers
**Priority:** MEDIUM | **Status:** Needs Implementation

**Trigger Points:**
- New booking created → Confirmation email
- Payment successful → Receipt email
- Booking starts tomorrow → Reminder email
- Booking completed → Thank you + review request email
- Password reset requested → Reset link email

---

## Phase 7: Error Handling & UX Polish

### 7.1 Error Boundaries
**Priority:** MEDIUM | **Status:** Needs Implementation

**Tasks:**
- [ ] Add React Error Boundary components
- [ ] Create user-friendly error pages
- [ ] Add retry mechanisms for failed API calls
- [ ] Implement toast notifications for errors

### 7.2 Loading States
**Priority:** MEDIUM | **Status:** Needs Implementation

**Tasks:**
- [ ] Add skeleton loaders for all data-fetching pages
- [ ] Implement button loading states
- [ ] Add progress indicators for multi-step forms
- [ ] Show loading overlay during navigation

### 7.3 Form Validation
**Priority:** MEDIUM | **Status:** Partial

**Tasks:**
- [ ] Add Zod schemas for all forms (matching backend)
- [ ] Display inline validation errors
- [ ] Add form-level error summaries
- [ ] Implement real-time validation feedback

---

## Phase 8: Testing & Quality Assurance

### 8.1 API Testing
**Priority:** HIGH | **Status:** Needs Implementation

**Tasks:**
- [ ] Write/run Supertest tests for all API endpoints
- [ ] Test authentication flows
- [ ] Test authorization (role-based access)
- [ ] Test error handling

### 8.2 Frontend Testing
**Priority:** MEDIUM | **Status:** Needs Implementation

**Tasks:**
- [ ] Component unit tests with Vitest
- [ ] Integration tests for key flows
- [ ] E2E tests with Playwright:
  - Customer registration/login
  - Vehicle browsing and filtering
  - Complete booking flow
  - Admin vehicle management

---

## Implementation Priority Matrix

| Phase | Priority | Complexity | Dependencies |
|-------|----------|------------|--------------|
| 1. Database & Backend | CRITICAL | Low | None |
| 2. Customer Web App | HIGH | Medium | Phase 1 |
| 3. Admin Dashboard | HIGH | Medium | Phase 1 |
| 4. Payment Integration | HIGH | Medium | Phase 2, 3 |
| 5. File Storage | MEDIUM | Low | Phase 2, 3 |
| 6. Email Notifications | MEDIUM | Low | Phase 2, 4 |
| 7. Error Handling | MEDIUM | Low | Phase 2, 3 |
| 8. Testing | HIGH | Medium | All phases |

---

## Recommended Implementation Order

### Sprint 1: Foundation
1. ✅ Database sync and seed
2. ✅ Backend server running
3. Customer Web API client setup
4. Customer authentication integration
5. Admin authentication integration

### Sprint 2: Core Features
6. Vehicles page integration (customer)
7. Fleet management integration (admin)
8. Booking flow integration
9. Bookings management (admin)

### Sprint 3: Transactions
10. Stripe payment integration
11. Dashboard stats integration
12. Customer dashboard pages
13. Customer management (admin)

### Sprint 4: Polish
14. File storage setup
15. Document upload
16. Email notifications
17. Error handling improvements
18. Loading states and UX polish

### Sprint 5: Quality
19. API endpoint testing
20. Frontend component testing
21. E2E testing
22. Performance optimization
23. Security audit

---

## File Change Summary

### Backend (Minimal Changes Needed)
| File | Change | Priority |
|------|--------|----------|
| `server/src/routes/payments.ts` | Complete confirm endpoint | HIGH |
| `server/src/routes/auth.ts` | Complete reset-password | MEDIUM |
| `server/src/services/email.ts` | Create email service | MEDIUM |
| `server/src/services/storage.ts` | Create storage service | MEDIUM |

### Customer Web App (Major Integration)
| File | Change | Priority |
|------|--------|----------|
| `apps/web/src/lib/api.ts` | Enhance API client | HIGH |
| `apps/web/src/stores/authStore.ts` | Real auth integration | HIGH |
| `apps/web/src/pages/VehiclesPage.tsx` | Remove mocks, add API | HIGH |
| `apps/web/src/pages/VehicleDetailPage.tsx` | Add API integration | HIGH |
| `apps/web/src/pages/BookingPage.tsx` | Connect to backend | HIGH |
| `apps/web/src/pages/auth/*.tsx` | Real auth flows | HIGH |
| `apps/web/src/pages/dashboard/*.tsx` | API integration | MEDIUM |
| `apps/web/src/components/home/FeaturedVehicles.tsx` | API integration | MEDIUM |

### Admin Dashboard (Major Integration)
| File | Change | Priority |
|------|--------|----------|
| `apps/admin/src/lib/api.ts` | Create API client | HIGH |
| `apps/admin/src/stores/authStore.ts` | Real auth integration | HIGH |
| `apps/admin/src/App.tsx` | Add route protection | HIGH |
| `apps/admin/src/pages/LoginPage.tsx` | Real login flow | HIGH |
| `apps/admin/src/pages/DashboardHome.tsx` | API integration | HIGH |
| `apps/admin/src/pages/FleetManagement.tsx` | Remove mocks, add CRUD | HIGH |
| `apps/admin/src/pages/BookingsPage.tsx` | API integration | HIGH |
| `apps/admin/src/pages/CustomersPage.tsx` | API integration | MEDIUM |
| `apps/admin/src/pages/AnalyticsPage.tsx` | API integration | MEDIUM |

---

## Environment Variables Checklist

### Server (`server/.env`)
```bash
# Database (Required)
DATABASE_URL="postgresql://..." ✅ Configured
DIRECT_URL="postgresql://..."   ✅ Configured

# Auth (Required)
JWT_SECRET="..."                ✅ Configured
JWT_EXPIRES_IN="7d"             ✅ Configured

# Server (Required)
PORT=3000                       ✅ Configured
NODE_ENV="development"          ✅ Configured

# Stripe (Required for payments)
STRIPE_SECRET_KEY="sk_test_..." ⚠️ Needs real key
STRIPE_PUBLISHABLE_KEY="pk_..." ⚠️ Needs real key
STRIPE_WEBHOOK_SECRET="whsec_." ⚠️ Needs setup

# Email (Required for notifications)
SENDGRID_API_KEY="SG...."       ⚠️ Needs real key
SENDGRID_FROM_EMAIL="..."       ✅ Configured

# URLs
WEB_URL="http://localhost:5173" ✅ Configured
ADMIN_URL="http://localhost:5174" ✅ Configured

# Storage (Optional)
AWS_ACCESS_KEY_ID=""            ⏸️ Optional
AWS_SECRET_ACCESS_KEY=""        ⏸️ Optional
AWS_S3_BUCKET=""                ⏸️ Optional
```

### Web App (`apps/web/.env`)
```bash
VITE_API_URL=http://localhost:3000 ✅ Configured
VITE_SUPABASE_URL="..."            ✅ Configured
VITE_SUPABASE_ANON_KEY="..."       ✅ Configured
VITE_STRIPE_PUBLISHABLE_KEY="..."  ⚠️ Needs adding
```

### Admin App (`apps/admin/.env`)
```bash
VITE_API_URL=http://localhost:3000 ⚠️ Needs adding
VITE_SUPABASE_URL="..."            ✅ Configured
VITE_SUPABASE_ANON_KEY="..."       ✅ Configured
```

---

## Success Metrics

### Phase 1 Complete When:
- [ ] Database has all tables created
- [ ] Seed data is loaded (admin user, test vehicles)
- [ ] Backend server starts without errors
- [ ] API endpoints respond correctly via curl/Postman

### Phase 2 Complete When:
- [ ] Users can register and login on customer site
- [ ] Vehicles page shows real data from database
- [ ] Booking flow creates real booking records
- [ ] Customer dashboard shows user's actual bookings

### Phase 3 Complete When:
- [ ] Admin login works with role verification
- [ ] Dashboard shows real statistics
- [ ] Fleet management CRUD works end-to-end
- [ ] Bookings can be viewed and managed

### Phase 4 Complete When:
- [ ] Customers can complete payment via Stripe
- [ ] Payment records are created in database
- [ ] Webhooks update booking status correctly
- [ ] Refunds can be processed from admin

### Full Completion When:
- [ ] All mock data removed from codebase
- [ ] No setTimeout simulations remain
- [ ] All API integrations working
- [ ] Error handling in place
- [ ] Tests passing
- [ ] Production deployment ready

---

## Quick Start Commands

```bash
# Terminal 1: Start Backend
cd server
pnpm install
pnpm db:push    # Sync database schema
pnpm db:seed    # Load test data
pnpm dev        # Start server on port 3000

# Terminal 2: Start Customer Web App
cd apps/web
pnpm install
pnpm dev        # Start on port 5173

# Terminal 3: Start Admin Dashboard
cd apps/admin
pnpm install
pnpm dev        # Start on port 5174

# Database Management
cd server
pnpm prisma studio    # Visual database browser
pnpm db:migrate       # Run migrations (production)
```

---

## Notes

- The backend is more complete than the audit suggested - 6 full route modules exist
- Frontend components are polished; main work is replacing mock data with API calls
- Supabase is configured for auth but we're using Express + JWT for the main API
- Consider using React Query for data fetching (already in dependencies)
- TypeScript types are shared via `packages/types` - use them for API responses

---

*Document Created: January 2025*
*Last Updated: January 2025*
*Version: 1.0*
