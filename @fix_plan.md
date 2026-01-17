# Gem Auto Rentals - Implementation Plan

## Phase 1: Project Foundation (High Priority)

### 1.1 Monorepo Setup
- [ ] Initialize pnpm workspace with Turborepo
- [ ] Create apps/web (customer frontend with Vite + React + TypeScript)
- [ ] Create apps/admin (admin dashboard with Vite + React + TypeScript)
- [ ] Create packages/ui (shared shadcn/ui components)
- [ ] Create packages/types (shared TypeScript types)
- [ ] Create packages/utils (shared utilities)
- [ ] Create server directory (Express.js backend)

### 1.2 Frontend Setup (Both Apps)
- [ ] Configure Tailwind CSS with custom design tokens
- [ ] Install and configure shadcn/ui
- [ ] Set up Lucide React icons
- [ ] Configure Framer Motion for animations
- [ ] Set up React Router v6
- [ ] Configure Zustand for state management
- [ ] Set up React Hook Form + Zod

### 1.3 Backend Setup
- [ ] Initialize Express.js with TypeScript
- [ ] Set up Prisma ORM
- [ ] Create database schema (User, Vehicle, Booking, Payment, Document models)
- [ ] Configure JWT authentication middleware
- [ ] Set up Zod validation schemas
- [ ] Create API route structure

### 1.4 Shared Components (packages/ui)
- [ ] Button (with gradient variant)
- [ ] Card (with hover effects)
- [ ] Input / Form fields
- [ ] Modal / Dialog
- [ ] Table
- [ ] Badge / Status indicators
- [ ] Avatar
- [ ] Skeleton loaders

## Phase 2: Customer-Facing Website (High Priority)

### 2.1 Landing Page
- [ ] Header/Navigation component (fixed, blur on scroll, mobile menu)
- [ ] Hero section (gradient background, headlines, CTA)
- [ ] Featured Vehicles section (grid of vehicle cards)
- [ ] How It Works section (4-step process)
- [ ] Why Choose Us section (benefit cards)
- [ ] Statistics section (count-up animation)
- [ ] Testimonials section (carousel)
- [ ] FAQ section (accordion)
- [ ] CTA section (gradient background)
- [ ] Footer (multi-column layout)

### 2.2 Vehicle Pages
- [ ] Vehicle listing page with filters and search
- [ ] Vehicle detail page with image gallery
- [ ] Vehicle card component (reusable)
- [ ] Filter sidebar component
- [ ] Availability calendar component

### 2.3 Booking Flow
- [ ] Multi-step booking wizard
- [ ] Date & location selection
- [ ] Extras selection (insurance, GPS, etc.)
- [ ] Customer information form
- [ ] Document upload (driver's license)
- [ ] Payment integration (Stripe)
- [ ] Booking confirmation page

### 2.4 Customer Dashboard
- [ ] Dashboard layout with sidebar
- [ ] My Bookings page (tabs: active, upcoming, past)
- [ ] Profile management page
- [ ] Documents page
- [ ] Payment methods page

### 2.5 Auth Pages
- [ ] Login page
- [ ] Register page
- [ ] Forgot password page
- [ ] Reset password page

## Phase 3: Admin CRM Dashboard (Medium Priority)

### 3.1 Dashboard Layout
- [ ] Collapsible sidebar navigation (Nexus-style)
- [ ] Top header with search, notifications, profile
- [ ] Main content area with responsive layout

### 3.2 Dashboard Home
- [ ] Metrics cards (Active Rentals, Revenue, Pending, Available)
- [ ] Revenue chart (Recharts bar chart)
- [ ] Recent bookings table
- [ ] Quick actions panel

### 3.3 Fleet Management
- [ ] Vehicle list with TanStack Table
- [ ] Add/Edit vehicle modal with image upload
- [ ] Vehicle status management
- [ ] Bulk actions
- [ ] Maintenance scheduling

### 3.4 Booking Management
- [ ] Booking list with filters
- [ ] Booking detail view
- [ ] Status update workflow
- [ ] Contract generation (PDF)
- [ ] Payment tracking

### 3.5 Customer Management
- [ ] Customer list with search
- [ ] Customer profile view
- [ ] Booking history per customer
- [ ] Document verification workflow
- [ ] Notes/communication log

### 3.6 Analytics
- [ ] Revenue charts
- [ ] Booking trends
- [ ] Fleet utilization
- [ ] Export to CSV/PDF

## Phase 4: Backend API (Medium Priority)

### 4.1 Authentication API
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] POST /api/auth/forgot-password
- [ ] POST /api/auth/reset-password
- [ ] GET /api/auth/me

### 4.2 Vehicles API
- [ ] GET /api/vehicles (with filters)
- [ ] GET /api/vehicles/:id
- [ ] POST /api/vehicles (admin)
- [ ] PUT /api/vehicles/:id (admin)
- [ ] DELETE /api/vehicles/:id (admin)
- [ ] PATCH /api/vehicles/:id/status (admin)

### 4.3 Bookings API
- [ ] GET /api/bookings
- [ ] GET /api/bookings/:id
- [ ] POST /api/bookings
- [ ] PATCH /api/bookings/:id
- [ ] POST /api/bookings/:id/cancel

### 4.4 Customers API
- [ ] GET /api/customers (admin)
- [ ] GET /api/customers/:id
- [ ] PUT /api/customers/:id
- [ ] DELETE /api/customers/:id (admin)

### 4.5 Payments API
- [ ] POST /api/payments/create-intent
- [ ] POST /api/payments/confirm
- [ ] GET /api/payments/:bookingId

## Phase 5: Polish & Testing (Low Priority)

### 5.1 Responsive Design
- [ ] Test all pages on mobile (375px)
- [ ] Test all pages on tablet (768px)
- [ ] Test all pages on desktop (1280px+)
- [ ] Fix any responsive issues

### 5.2 Performance
- [ ] Optimize images (lazy loading, WebP)
- [ ] Code splitting for routes
- [ ] Skeleton loading states
- [ ] API response caching

### 5.3 Testing
- [ ] Unit tests for utilities
- [ ] API endpoint tests
- [ ] Component tests for critical UI

### 5.4 Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Component documentation
- [ ] Deployment guide

## Completed
- [x] Project initialization with Ralph

## Current Focus
Start with Phase 1.1: Monorepo Setup - Initialize the pnpm workspace with Turborepo and create the basic project structure.

## Notes
- Use shadcn/ui components as foundation
- Follow mobile-first responsive design
- Prioritize customer-facing features for MVP
- Admin dashboard can be simplified initially
- Focus on core booking flow end-to-end first
