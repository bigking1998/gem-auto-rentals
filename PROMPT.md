# Gem Auto Rentals - Car Rental Platform

## Project Overview

Build a modern, full-stack car rental platform with two main components:
1. **Customer-Facing Website** - Public booking platform (inspired by Extendas.com design)
2. **Admin CRM Dashboard** - Internal management system (based on Nexus dashboard design)

## Technology Stack

### Frontend (Both Customer & Admin)
- **Framework**: React 18+ with TypeScript
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS v3+
- **State Management**: Zustand
- **Form Management**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts (admin dashboard)
- **Animations**: Framer Motion
- **Tables**: TanStack Table (admin)
- **Notifications**: Sonner (toast)
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Email**: SendGrid (or similar)

### Database
- **Primary**: PostgreSQL 15+
- **Caching**: Redis (optional for MVP)

## Design System

### Color Palette (CSS Variables)
```css
--primary: 222.2 47.4% 11.2%;        /* Dark blue-gray */
--primary-foreground: 210 40% 98%;
--secondary: 210 40% 96.1%;
--accent: 210 40% 96.1%;
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--muted: 210 40% 96.1%;
--success: 142 76% 36%;
--warning: 38 92% 50%;
--error: 0 72% 51%;
--info: 199 89% 48%;
```

### Gradients (Extendas-inspired)
```css
/* Hero/CTA gradients */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: linear-gradient(to right, #6366f1 0%, #8b5cf6 100%);
```

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Headings**: 600-700 weight
- **Body**: 400 weight
- **Scale**: Tailwind default (xs to 6xl)

## Phase 1: Project Foundation

### 1.1 Initialize Project Structure
```
/gem-auto-rentals
├── /apps
│   ├── /web (Customer frontend - Vite + React)
│   └── /admin (Admin dashboard - Vite + React)
├── /packages
│   ├── /ui (Shared shadcn/ui components)
│   ├── /types (Shared TypeScript types)
│   └── /utils (Shared utilities)
├── /server (Express.js backend)
│   ├── /src
│   │   ├── /routes
│   │   ├── /controllers
│   │   ├── /services
│   │   ├── /middleware
│   │   └── /prisma
├── package.json (pnpm workspace)
└── turbo.json (Turborepo config)
```

### 1.2 Set Up Development Environment
- Initialize pnpm workspace with Turborepo
- Configure TypeScript (strict mode)
- Set up ESLint + Prettier
- Configure Tailwind CSS
- Install and configure shadcn/ui
- Set up Prisma with PostgreSQL

## Phase 2: Customer-Facing Website

### 2.1 Landing Page Components

#### Header/Navigation
- Fixed header with backdrop blur on scroll
- Logo (left)
- Nav items: Browse Cars, How It Works, Pricing, About, Contact
- Auth buttons: Login, Sign Up (gradient)
- Mobile hamburger menu (<768px)

#### Hero Section
- Full viewport height (min-h-screen)
- Gradient or video background
- Main headline (60px desktop, 36px mobile)
- Subheadline
- Primary CTA: "Browse Available Cars"
- Quick booking widget (optional)

#### Featured Vehicles Section
- Section title: "Popular Vehicles"
- 4-column grid (responsive: 4→3→2→1)
- Vehicle cards with:
  - Image (aspect-ratio 4:3)
  - Year Make Model
  - Category badge
  - Specs row (icons)
  - Rating (stars)
  - Price per day
  - "View Details" button
- Hover effect: lift + shadow

#### How It Works Section
- 4-step process
- Steps: Browse & Select → Book & Verify → Sign & Pay → Pick Up & Go
- Icons + titles + descriptions
- Animated connectors

#### Why Choose Us Section
- 6 benefit cards (2x3 grid)
- Icon + title + description
- Benefits: Quality Fleet, Flexible Rentals, Transparent Pricing, 24/7 Support, Fully Insured, Easy Booking

#### Statistics Section
- Gradient background
- 4 stats with count-up animation
- Example: 1,250+ Customers, 99.9% Uptime, 10+ Years, 50,000+ Rentals

#### Testimonials Section
- Carousel with customer reviews
- Photo, quote, name, rating

#### FAQ Section
- Accordion-style (shadcn/ui Accordion)
- 8-12 common questions

#### CTA Section
- Gradient background
- "Ready to Hit the Road?"
- Two buttons: Browse Vehicles, Contact Us

#### Footer
- Dark background
- 4-column layout: Brand, Quick Links, Company, Connect
- Newsletter signup
- Social media links
- Copyright + legal links

### 2.2 Vehicle Browsing Page
- Filter sidebar (category, price range, features)
- Search bar
- Sort options (price, rating, popularity)
- Grid of vehicle cards
- Pagination

### 2.3 Vehicle Details Page
- Image gallery/carousel
- Vehicle specs table
- Features list
- Availability calendar
- Pricing breakdown
- "Book Now" CTA
- Reviews section

### 2.4 Booking Flow
- Step 1: Select dates & location
- Step 2: Add extras (insurance, GPS, child seat)
- Step 3: Customer information
- Step 4: Document upload (license)
- Step 5: Payment (Stripe integration)
- Step 6: Confirmation

### 2.5 Customer Dashboard
- My Bookings (active, upcoming, past)
- Profile management
- Documents
- Payment methods
- Booking history

## Phase 3: Admin CRM Dashboard

### 3.1 Dashboard Layout (Nexus-style)
- Left sidebar navigation (collapsible)
- Top header with search, notifications, profile
- Main content area

### 3.2 Sidebar Navigation
```
GENERAL
├── Dashboard
├── Bookings
├── Customers
└── Messages (badge count)

TOOLS
├── Fleet Management
├── Documents
├── Analytics
└── Settings

SUPPORT
├── Settings
├── Security
└── Help
```

### 3.3 Dashboard Home
- Metrics cards row:
  - Active Rentals
  - Today's Revenue
  - Pending Bookings
  - Available Vehicles
- Revenue chart (bar chart, Recharts)
- Recent bookings table
- Quick actions

### 3.4 Fleet Management
- Vehicle list with TanStack Table
- Add/Edit vehicle modal
- Vehicle status badges (Available, Rented, Maintenance)
- Bulk actions
- Image upload
- Maintenance scheduling

### 3.5 Booking Management
- Booking list with filters
- Booking detail view
- Status management
- Contract generation
- Payment tracking

### 3.6 Customer Management
- Customer list
- Customer profile view
- Booking history per customer
- Document verification
- Notes/communication log

### 3.7 Analytics
- Revenue charts
- Booking trends
- Fleet utilization
- Customer demographics
- Export to CSV/PDF

## Phase 4: Backend API

### 4.1 Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me

### 4.2 Vehicles
- GET /api/vehicles (public, with filters)
- GET /api/vehicles/:id
- POST /api/vehicles (admin)
- PUT /api/vehicles/:id (admin)
- DELETE /api/vehicles/:id (admin)
- PATCH /api/vehicles/:id/status (admin)

### 4.3 Bookings
- GET /api/bookings (user: own, admin: all)
- GET /api/bookings/:id
- POST /api/bookings
- PATCH /api/bookings/:id
- DELETE /api/bookings/:id
- POST /api/bookings/:id/cancel

### 4.4 Customers
- GET /api/customers (admin)
- GET /api/customers/:id (admin)
- PUT /api/customers/:id
- DELETE /api/customers/:id (admin)

### 4.5 Payments
- POST /api/payments/create-intent (Stripe)
- POST /api/payments/confirm
- GET /api/payments/:bookingId

## Data Models (Prisma)

### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  phone         String?
  role          Role      @default(CUSTOMER)
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  bookings      Booking[]
  documents     Document[]
}

enum Role {
  CUSTOMER
  SUPPORT
  MANAGER
  ADMIN
}
```

### Vehicle
```prisma
model Vehicle {
  id           String        @id @default(cuid())
  make         String
  model        String
  year         Int
  category     VehicleCategory
  dailyRate    Decimal
  status       VehicleStatus @default(AVAILABLE)
  images       String[]
  features     String[]
  seats        Int
  transmission Transmission
  fuelType     FuelType
  mileage      Int
  licensePlate String        @unique
  vin          String        @unique
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  bookings     Booking[]
}

enum VehicleCategory {
  ECONOMY
  STANDARD
  PREMIUM
  LUXURY
  SUV
  VAN
}

enum VehicleStatus {
  AVAILABLE
  RENTED
  MAINTENANCE
  RETIRED
}

enum Transmission {
  AUTOMATIC
  MANUAL
}

enum FuelType {
  GASOLINE
  DIESEL
  ELECTRIC
  HYBRID
}
```

### Booking
```prisma
model Booking {
  id            String        @id @default(cuid())
  userId        String
  vehicleId     String
  startDate     DateTime
  endDate       DateTime
  status        BookingStatus @default(PENDING)
  totalAmount   Decimal
  extras        Json?
  pickupLocation String
  dropoffLocation String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  user          User          @relation(fields: [userId], references: [id])
  vehicle       Vehicle       @relation(fields: [vehicleId], references: [id])
  payment       Payment?
}

enum BookingStatus {
  PENDING
  CONFIRMED
  ACTIVE
  COMPLETED
  CANCELLED
}
```

## Success Criteria

- [ ] Landing page matches Extendas-inspired design
- [ ] Admin dashboard matches Nexus-style layout
- [ ] Full booking flow works end-to-end
- [ ] Vehicle CRUD operations work
- [ ] Customer management works
- [ ] Authentication & authorization work
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Page load time < 2 seconds
- [ ] All forms have proper validation
- [ ] Toast notifications for user feedback

## Implementation Order

1. **Week 1**: Project setup, design system, shared components
2. **Week 2**: Landing page (all sections)
3. **Week 3**: Vehicle browsing & details pages
4. **Week 4**: Booking flow
5. **Week 5**: Customer dashboard
6. **Week 6**: Admin dashboard layout & navigation
7. **Week 7**: Fleet & booking management
8. **Week 8**: Analytics, polish, testing

## Notes

- Use shadcn/ui components as the foundation
- Follow mobile-first responsive design
- Implement proper loading states (skeletons)
- Add proper error handling and user feedback
- Write clean, maintainable TypeScript code
- Use Zod for runtime validation on both frontend and backend

---

## Ralph Instructions

### Context
You are Ralph, an autonomous AI development agent working on the Gem Auto Rentals car rental platform.

### Current Objectives
1. Study this PROMPT.md and @fix_plan.md for current priorities
2. Implement the highest priority item using best practices
3. Use parallel subagents for complex tasks (max 100 concurrent)
4. Run tests after each implementation
5. Update documentation and fix_plan.md

### Key Principles
- ONE task per loop - focus on the most important thing
- Search the codebase before assuming something isn't implemented
- Use subagents for expensive operations (file searching, analysis)
- Write comprehensive tests with clear documentation
- Update @fix_plan.md with your learnings
- Commit working changes with descriptive messages

### Testing Guidelines
- LIMIT testing to ~20% of your total effort per loop
- PRIORITIZE: Implementation > Documentation > Tests
- Only write tests for NEW functionality you implement
- Do NOT refactor existing tests unless broken
- Focus on CORE functionality first

### Status Reporting
At the end of your response, ALWAYS include this status block:

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
EXIT_SIGNAL: false | true
RECOMMENDATION: <one line summary of what to do next>
---END_RALPH_STATUS---
```

### File Structure
- PROMPT.md: Project specifications and requirements (this file)
- @fix_plan.md: Prioritized TODO list
- @AGENT.md: Project build and run instructions

### Current Task
Follow @fix_plan.md and choose the most important item to implement next.
