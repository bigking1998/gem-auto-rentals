# Product Requirements Document (PRD)
## Car Rental Platform & CRM System

**Version:** 1.0  
**Date:** January 17, 2026  
**Document Owner:** Product Development Team

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Design System & Visual Identity](#design-system--visual-identity)
4. [System Architecture](#system-architecture)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Customer-Facing Platform](#customer-facing-platform)
7. [Admin CRM System](#admin-crm-system)
8. [Authentication & Security](#authentication--security)
9. [API Integrations](#api-integrations)
10. [Data Models](#data-models)
11. [Technical Requirements](#technical-requirements)
12. [User Workflows](#user-workflows)
13. [Performance Requirements](#performance-requirements)
14. [Security & Compliance](#security--compliance)
15. [Future Enhancements](#future-enhancements)

---

## 1. Executive Summary

### 1.1 Purpose
This document outlines the requirements for a dual-sided car rental platform consisting of:
- **Customer-Facing Platform**: Modern, professional public website for browsing, booking, and managing car rentals (inspired by Extendas.com design language)
- **Admin CRM System**: Comprehensive internal management dashboard for fleet, customers, contracts, and operations (based on Nexus dashboard design)

### 1.2 Goals
- Create a visually stunning, user-friendly rental booking experience
- Centralize vehicle inventory and customer relationship management
- Automate rental workflows and reduce manual administrative tasks
- Provide real-time availability and booking management
- Enable data-driven business decisions through analytics
- Deliver a seamless, modern interface matching industry-leading designs

### 1.3 Success Metrics
- Booking conversion rate: >15%
- Average booking time: <5 minutes
- Customer satisfaction score: >4.5/5
- Vehicle utilization rate: >70%
- Admin task completion time reduction: 50%
- Page load time: <2 seconds
- Mobile responsiveness score: 95+

---

## 2. Product Overview

### 2.1 Product Vision
Create a modern, visually appealing car rental platform that simplifies the rental process for customers while providing comprehensive management tools for business operations. The platform should feel premium, trustworthy, and efficient.

### 2.2 Target Users
- **Primary**: Individuals seeking short-term car rentals
- **Secondary**: Business administrators managing fleet and operations
- **Tertiary**: Customer support staff

### 2.3 Key Differentiators
- Modern, gradient-rich design inspired by leading SaaS platforms
- Integrated CRM and customer platform with seamless data flow
- Real-time availability and instant booking
- Digital contract signing and document management
- Automated notifications and reminders
- Comprehensive vehicle tracking and maintenance management
- Professional admin dashboard with data visualization

---

## 3. Design System & Visual Identity

### 3.1 Design References

#### Customer-Facing Platform Design
**Primary Reference:** Extendas.com (https://www.extendas.com/en/)

**Design Characteristics:**
- Clean, modern, professional aesthetic
- Generous whitespace for content breathing room
- Soft gradient backgrounds (particularly on hero sections and CTAs)
- Full-width hero sections with video backgrounds or high-quality imagery
- Card-based layouts for content organization
- Smooth animations and transitions
- Professional color scheme with brand identity
- Mobile-first responsive design
- High-quality photography showcasing products/services
- Clear typography hierarchy

**Key Design Elements to Implement:**
1. **Hero Section**: Full-width with video background or gradient overlay
2. **Navigation**: Clean header with mega-menu support
3. **Cards**: Rounded corners, subtle shadows, hover effects
4. **CTAs**: Gradient buttons with clear hierarchy
5. **Statistics**: Large numbers with context (e.g., "1250+ locations")
6. **Footer**: Comprehensive with organized link sections
7. **Animations**: Subtle fade-ins, parallax effects on scroll

#### Admin Dashboard Design
**Primary Reference:** Nexus Dashboard (uploaded reference image)

**Design Characteristics:**
- Left sidebar navigation with collapsible sections
- Clean, data-dense layouts with card-based widgets
- Soft blue/purple color scheme with gradients
- Rounded corners on all UI elements
- Clear visual hierarchy with spacing
- Chart visualizations with consistent styling
- Icon-based navigation with labels
- Light background with white cards
- Subtle shadows for depth
- Professional data tables with alternating rows
- Filter and sort controls integrated into views

**Dashboard Components to Implement:**

**Sidebar Navigation:**
```
┌─────────────────────┐
│ Logo                │
│ [Collapse Icon]     │
├─────────────────────┤
│ GENERAL             │
│ ▣ Dashboard         │
│ ⚡ Bookings         │
│ 👥 Customers        │
│ 💬 Messages     (8) │
├─────────────────────┤
│ TOOLS               │
│ 🚗 Fleet            │
│ 📄 Documents        │
│ 📊 Analytics        │
│ ⚙️ Settings         │
├─────────────────────┤
│ SUPPORT             │
│ ⚙️ Settings         │
│ 🔒 Security         │
│ ❓ Help             │
└─────────────────────┘
```

**Dashboard Metrics Cards:**
```
┌────────────────────┬────────────────────┬────────────────────┐
│ 👁 Page Views      │ 📄 Total Revenue   │ 📉 Bounce Rate     │
│ 12,450             │ $ 363.95           │ 86.5%              │
│ 15.8% ↗            │ 34.0% ↗            │ 24.2% ↗            │
└────────────────────┴────────────────────┴────────────────────┘
```

**Chart Styling:**
- Bar charts with rounded tops
- Soft blue/purple gradient fills
- Light gray backgrounds
- Hover tooltips
- Responsive scaling
- Clear axis labels
- Legend indicators

### 3.2 UI Framework & Component Library

**Primary UI Framework:**
- **shadcn/ui** - Complete component library
  - Built on Radix UI primitives
  - Fully accessible (WCAG 2.1 AA compliant)
  - Customizable with Tailwind CSS
  - TypeScript support
  - Dark mode ready (if needed in future)

**shadcn/ui Components to Use:**
- Button (with variants: default, destructive, outline, ghost, link)
- Card (for content containers)
- Dialog/Modal
- Dropdown Menu
- Form (with validation)
- Input (text, email, phone, etc.)
- Select/Combobox
- Checkbox/Radio Group
- Table (with sorting, filtering)
- Tabs
- Toast (notifications)
- Popover
- Calendar/Date Picker
- Badge
- Avatar
- Sheet (slide-out panels)
- Alert/Alert Dialog
- Progress Bar
- Skeleton (loading states)
- Accordion
- Separator
- Command Menu (for search)
- Context Menu

### 3.3 Color Palette

**Primary Colors:**
```css
/* Main Brand Colors - Adjust based on your brand */
--primary: 222.2 47.4% 11.2%;        /* Dark blue-gray */
--primary-foreground: 210 40% 98%;    /* Light text on primary */

/* Secondary accent */
--secondary: 210 40% 96.1%;           /* Light gray-blue */
--secondary-foreground: 222.2 47.4% 11.2%;

/* Accent colors */
--accent: 210 40% 96.1%;
--accent-foreground: 222.2 47.4% 11.2%;

/* UI Colors */
--background: 0 0% 100%;              /* White */
--foreground: 222.2 84% 4.9%;         /* Near black */

--muted: 210 40% 96.1%;               /* Muted backgrounds */
--muted-foreground: 215.4 16.3% 46.9%; /* Muted text */

--card: 0 0% 100%;                    /* Card backgrounds */
--card-foreground: 222.2 84% 4.9%;

--border: 214.3 31.8% 91.4%;          /* Border colors */
--input: 214.3 31.8% 91.4%;           /* Input borders */
--ring: 222.2 84% 4.9%;               /* Focus rings */

/* Status Colors */
--success: 142 76% 36%;               /* Green */
--warning: 38 92% 50%;                /* Orange */
--error: 0 72% 51%;                   /* Red */
--info: 199 89% 48%;                  /* Blue */
```

**Gradient Examples (inspired by Extendas):**
```css
/* Hero gradients */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
background: linear-gradient(120deg, #f093fb 0%, #f5576c 100%);

/* Button gradients */
background: linear-gradient(to right, #6366f1 0%, #8b5cf6 100%);

/* Card hover effects */
background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
```

### 3.4 Typography

**Font System:**
```css
/* Primary Font Family - Clean, modern sans-serif */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Alternative: Geist (if preferred) */
font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;

/* Headings */
--font-heading: 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'Fira Code', 'Consolas', monospace; /* For code/data */

/* Font Sizes (Tailwind scale) */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

**Typography Hierarchy:**
```css
/* Hero Heading */
.hero-title {
  font-size: 3.75rem;  /* 60px */
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Section Headings */
.section-heading {
  font-size: 2.25rem;  /* 36px */
  font-weight: 600;
  line-height: 1.2;
}

/* Card Titles */
.card-title {
  font-size: 1.5rem;   /* 24px */
  font-weight: 600;
  line-height: 1.3;
}

/* Body Text */
.body-text {
  font-size: 1rem;     /* 16px */
  font-weight: 400;
  line-height: 1.625;
}

/* Small Text */
.text-small {
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  line-height: 1.5;
}
```

### 3.5 Spacing & Layout

**Spacing Scale (Tailwind):**
```
0:    0px
0.5:  2px
1:    4px
1.5:  6px
2:    8px
2.5:  10px
3:    12px
3.5:  14px
4:    16px
5:    20px
6:    24px
7:    28px
8:    32px
9:    36px
10:   40px
11:   44px
12:   48px
14:   56px
16:   64px
20:   80px
24:   96px
28:   112px
32:   128px
```

**Container Widths:**
```css
/* Max widths for content */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Page container */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
```

**Layout Grid:**
- 12-column grid system
- Gutter: 24px (1.5rem)
- Responsive breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

### 3.6 Component Styling Guidelines

**Cards:**
```css
.card {
  background: white;
  border-radius: 0.75rem;  /* 12px */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}
```

**Buttons:**
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(to right, #6366f1, #8b5cf6);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: #6366f1;
  border: 2px solid #6366f1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}
```

**Forms:**
```css
.input {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
```

**Tables:**
```css
.table {
  width: 100%;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
}

.table thead {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
}

.table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.table tr:hover {
  background: #f9fafb;
}
```

### 3.7 Icons

**Icon Library:** Lucide React (https://lucide.dev/)
- Consistent with shadcn/ui ecosystem
- 1000+ icons
- Customizable size and stroke
- Tree-shakeable

**Common Icons to Use:**
- Car, Truck (vehicles)
- Calendar, Clock (dates/times)
- User, Users (customers)
- CreditCard, DollarSign (payments)
- FileText, File (documents)
- Settings, Tool (configuration)
- BarChart3, TrendingUp (analytics)
- CheckCircle, XCircle, AlertCircle (status)
- Search, Filter (search/filter)
- MoreHorizontal, MoreVertical (actions menu)

**Icon Sizes:**
- sm: 16px
- md: 20px (default)
- lg: 24px
- xl: 32px

### 3.8 Animation & Transitions

**Animation Principles:**
- Subtle and purposeful
- Enhance UX, don't distract
- Consistent timing functions
- 200-300ms for most transitions

**Framer Motion Animations:**

**Page Transitions:**
```javascript
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};
```

**Card Animations:**
```javascript
const cardVariants = {
  hover: {
    y: -4,
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
    transition: { duration: 0.2 }
  }
};
```

**Stagger Children:**
```javascript
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};
```

### 3.9 Responsive Design

**Mobile-First Approach:**
- Design for mobile (375px) first
- Scale up to tablet (768px)
- Optimize for desktop (1280px+)

**Breakpoint Strategy:**
```javascript
const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large screens
};
```

**Responsive Patterns:**
- Stack columns on mobile
- Show hamburger menu < 768px
- Collapse sidebar on mobile
- Touch-friendly tap targets (min 44x44px)
- Larger font sizes on mobile for readability
- Simplified forms on mobile

### 3.10 Dark Mode (Future Enhancement)

**Preparation:**
- Use CSS variables for all colors
- Define both light and dark palettes
- Test contrast ratios
- Use shadcn/ui dark mode utilities

---

## 4. System Architecture

### 4.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer / CDN                  │
│                    (CloudFlare)                         │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│   Customer     │                    │     Admin       │
│   Frontend     │                    │    Frontend     │
│   (React +     │                    │    (React +     │
│   shadcn/ui)   │                    │    shadcn/ui)   │
└───────┬────────┘                    └────────┬────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                    ┌───────▼────────┐
                    │   API Gateway   │
                    │   (Express.js)  │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐   ┌────────▼────────┐
│ Auth Service   │  │   Business  │   │   Payment       │
│ (JWT + OAuth)  │  │   Logic     │   │   Service       │
│                │  │   Layer     │   │   (Stripe)      │
└───────┬────────┘  └──────┬──────┘   └────────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐   ┌────────▼────────┐
│   PostgreSQL   │  │    Redis    │   │   File Storage  │
│   (Primary DB) │  │   (Cache)   │   │   (S3/Cloudinary│
└────────────────┘  └─────────────┘   └─────────────────┘
```

### 4.2 Technology Stack

#### Frontend (Both Customer & Admin)
- **Framework**: React 18+ with TypeScript
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS v3+
- **State Management**: Zustand (lightweight, modern)
- **Form Management**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6 with code splitting
- **Icons**: Lucide React
- **Charts**: Recharts (admin dashboard)
- **Animations**: Framer Motion
- **Tables**: TanStack Table (for admin)
- **File Upload**: React Dropzone
- **PDF Viewer**: react-pdf
- **Calendar**: React Big Calendar or FullCalendar
- **Notifications**: Sonner (toast notifications)

**Customer Frontend Specific:**
- Image galleries: Swiper or Embla Carousel
- Maps integration: Mapbox or Google Maps
- Video backgrounds: HTML5 video with fallbacks

**Admin Frontend Specific:**
- Data visualization: Recharts + custom charts
- Rich text editor: Tiptap or Slate
- Drag and drop: dnd-kit
- Export functionality: xlsx, jsPDF

#### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma (type-safe, modern)
- **Authentication**: 
  - JWT for session management
  - bcrypt for password hashing
  - Passport.js for OAuth strategies
- **Validation**: Zod (shared schemas with frontend)
- **File Upload**: Multer
- **Email**: 
  - SendGrid for transactional emails
  - Handlebars for email templates
- **SMS**: Twilio
- **Logging**: Winston or Pino
- **Testing**: Jest + Supertest
- **API Documentation**: Swagger/OpenAPI

#### Database & Storage
- **Primary Database**: PostgreSQL 15+
  - ACID compliant
  - JSON support for flexible data
  - Full-text search
  - Geographic queries (PostGIS if needed)
- **Caching**: Redis 7+
  - Session storage
  - Rate limiting
  - Query caching
  - Real-time pub/sub
- **File Storage**: 
  - AWS S3 or Cloudinary
  - CDN for image delivery
  - Image optimization and transformation
- **Search**: PostgreSQL Full-Text Search (upgrade to Elasticsearch if needed)

#### Infrastructure
- **Hosting**: 
  - Frontend: Vercel (optimized for React)
  - Backend: AWS EC2, DigitalOcean, or Railway
  - Database: AWS RDS or DigitalOcean Managed Database
- **CDN**: CloudFlare
  - DDoS protection
  - SSL/TLS
  - Caching
  - Analytics
- **CI/CD**: GitHub Actions
  - Automated testing
  - Build and deploy
  - Database migrations
- **Monitoring**: 
  - Sentry (error tracking)
  - LogRocket (session replay)
  - DataDog or New Relic (APM)
- **Backup**: 
  - Automated daily database backups
  - Point-in-time recovery
  - S3 backup for files

#### External Services
- **Payment Processing**: Stripe
  - Card payments
  - ACH payments
  - Payment intents
  - Webhooks for status updates
  - Refunds and disputes
- **Identity Verification**: 
  - Onfido or Jumio (driver's license)
  - OCR for license data extraction
- **VIN Decoding**: NHTSA Vehicle API (free)
- **Notifications**:
  - Email: SendGrid
  - SMS: Twilio
- **Maps**: Google Maps API or Mapbox
- **Analytics**: 
  - Google Analytics 4
  - Mixpanel (product analytics)
  - Custom event tracking

### 4.3 Development Tools
- **Package Manager**: pnpm (fast, efficient)
- **Build Tool**: Vite (frontend)
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **Version Control**: Git + GitHub
- **Documentation**: Storybook (component library)
- **Type Checking**: TypeScript strict mode

---

## 5. User Roles & Permissions

### 5.1 Role Definitions

#### Customer (Public User)
**Permissions:**
- Browse available vehicles
- Create account and manage profile
- Make reservations
- View booking history
- Upload documents (license, insurance)
- Make payments
- Sign digital contracts
- Contact support
- Leave reviews
- Manage payment methods
- Download receipts and contracts

#### Support Staff
**Permissions:**
- View customer information
- View and update reservations
- Communicate with customers (email/SMS/chat)
- View vehicle availability
- Log support tickets
- View payment status (limited)
- Access knowledge base
- View booking calendar
- **Cannot**: Delete records, access financial settings, modify vehicles

#### Manager (Limited Admin)
**Permissions:**
- All Support Staff permissions
- View all vehicles and customers
- Manage reservations (create, modify, cancel)
- Update vehicle status
- View reports and analytics
- Approve customer verifications
- Process refunds (with limits)
- Manage maintenance schedules
- Export data
- **Cannot**: Delete records, access sensitive financial data, modify system settings

#### Admin (Full Access)
**Permissions:**
- All Manager permissions
- Full CRUD on vehicles
- Full CRUD on customers
- Manage all reservations
- Access all reports and analytics
- Manage system settings
- User management (create, edit, delete staff)
- Financial operations (all)
- Document management (all)
- Delete records
- Modify pricing and policies
- Access audit logs
- Manage integrations and API keys

### 5.2 Permission Matrix

| Feature | Customer | Support | Manager | Admin |
|---------|----------|---------|---------|-------|
| **Authentication** |
| Register Account | ✓ | ✗ | ✗ | ✗ |
| Login | ✓ | ✓ | ✓ | ✓ |
| Password Reset | ✓ | ✓ | ✓ | ✓ |
| **Vehicle Browsing** |
| View Available Vehicles | ✓ | ✓ | ✓ | ✓ |
| View Vehicle Details | ✓ | ✓ | ✓ | ✓ |
| Search/Filter Vehicles | ✓ | ✓ | ✓ | ✓ |
| **Booking Management** |
| Create Booking | ✓ | ✗ | ✓ | ✓ |
| View Own Bookings | ✓ | ✗ | ✗ | ✗ |
| View All Bookings | ✗ | ✓ | ✓ | ✓ |
| Modify Own Booking | ✓ | ✗ | ✗ | ✓ |
| Modify Any Booking | ✗ | Limited | ✓ | ✓ |
| Cancel Own Booking | ✓ | ✗ | ✗ | ✓ |
| Cancel Any Booking | ✗ | ✗ | ✓ | ✓ |
| **Customer Management** |
| View Own Profile | ✓ | ✗ | ✗ | ✓ |
| Edit Own Profile | ✓ | ✗ | ✗ | ✓ |
| View Customer Data | Own Only | ✓ | ✓ | ✓ |
| Edit Customer Data | Own Only | Limited | ✓ | ✓ |
| Delete Customer | ✗ | ✗ | ✗ | ✓ |
| Approve Verifications | ✗ | ✗ | ✓ | ✓ |
| **Fleet Management** |
| View Vehicles | Public Only | ✓ | ✓ | ✓ |
| Add Vehicle | ✗ | ✗ | ✗ | ✓ |
| Edit Vehicle | ✗ | ✗ | ✓ | ✓ |
| Delete Vehicle | ✗ | ✗ | ✗ | ✓ |
| Change Vehicle Status | ✗ | ✗ | ✓ | ✓ |
| **Financial Operations** |
| Make Payment | ✓ | ✗ | ✗ | ✗ |
| View Own Payments | ✓ | ✗ | ✗ | ✗ |
| View All Payments | ✗ | Limited | View Only | ✓ |
| Process Refund | ✗ | ✗ | Limited | ✓ |
| Access Financial Reports | ✗ | ✗ | View Only | ✓ |
| Modify Pricing | ✗ | ✗ | ✗ | ✓ |
| **Documents** |
| Upload Own Documents | ✓ | ✗ | ✗ | ✓ |
| View Own Documents | ✓ | ✗ | ✗ | ✓ |
| View All Documents | ✗ | Limited | ✓ | ✓ |
| Delete Documents | Own Only | ✗ | Limited | ✓ |
| **Analytics & Reports** |
| View Own Stats | ✓ | ✗ | ✗ | ✓ |
| View Dashboard Analytics | ✗ | Limited | ✓ | ✓ |
| Export Reports | ✗ | Limited | ✓ | ✓ |
| Create Custom Reports | ✗ | ✗ | ✗ | ✓ |
| **System Settings** |
| Modify System Settings | ✗ | ✗ | ✗ | ✓ |
| Manage Users/Staff | ✗ | ✗ | ✗ | ✓ |
| Manage Integrations | ✗ | ✗ | ✗ | ✓ |
| Access Audit Logs | ✗ | ✗ | Limited | ✓ |

### 5.3 Role-Based Access Control (RBAC) Implementation

**Backend Implementation:**
```typescript
// Example middleware structure
const permissions = {
  customer: ['bookings:create:own', 'bookings:read:own', 'profile:update:own'],
  support: ['bookings:read:all', 'customers:read:all', 'tickets:create'],
  manager: ['bookings:*:all', 'vehicles:read:all', 'vehicles:update:all'],
  admin: ['*:*:*'] // Full access
};

const checkPermission = (requiredPermission: string) => {
  return (req, res, next) => {
    const userPermissions = permissions[req.user.role];
    if (hasPermission(userPermissions, requiredPermission)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  };
};
```

---

## 6. Customer-Facing Platform

### 6.1 Public Landing Page

**URL:** `/` or `/home`

**Design Reference:** Extendas.com homepage structure

#### 6.1.1 Header/Navigation

**Design:**
- Fixed header with backdrop blur on scroll
- White/transparent background
- Shadow appears on scroll
- Mobile hamburger menu < 768px

**Components:**
```
┌────────────────────────────────────────────────────────────┐
│ [Logo]    Browse Cars   How It Works   Pricing   About    │
│                                         [Login] [Sign Up]  │
└────────────────────────────────────────────────────────────┘
```

**Navigation Items:**
- Logo (left, clickable to home)
- Browse Cars (link to `/vehicles`)
- How It Works (link to `/how-it-works`)
- Pricing (link to `/pricing`)
- About (link to `/about`)
- Contact (link to `/contact`)
- Login (button, opens modal or goes to `/login`)
- Sign Up (gradient button, primary CTA)

**Mobile Navigation:**
- Hamburger icon (≡)
- Slide-in menu from right
- Full-screen overlay
- Stack all navigation items
- Close button (X)

#### 6.1.2 Hero Section

**Design:**
- Full viewport height (min-height: 100vh)
- Background options:
  - Video background (like Extendas)
  - High-quality image with gradient overlay
  - Animated gradient background
- Content centered
- Scroll indicator at bottom

**Components:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                   [Video/Image Background]                 │
│                                                            │
│              ┌─────────────────────────────┐              │
│              │  Find Your Perfect Ride     │              │
│              │  Quality vehicles for every │              │
│              │  journey                    │              │
│              │                             │              │
│              │  [Browse Available Cars]    │              │
│              │  [Learn More →]             │              │
│              └─────────────────────────────┘              │
│                                                            │
│                     [Scroll Down ↓]                        │
└────────────────────────────────────────────────────────────┘
```

**Content:**
- **Main Headline**: Large, bold, attention-grabbing
  - Font size: 60px (desktop), 36px (mobile)
  - Font weight: 700
  - Example: "Your Perfect Ride Awaits" or "Drive Your Dream Car Today"
- **Subheadline**: Supporting text
  - Font size: 24px (desktop), 18px (mobile)
  - Font weight: 400
  - Color: Slightly muted
  - Example: "Premium vehicles, flexible rentals, transparent pricing"
- **Primary CTA**: Gradient button
  - "Browse Available Cars"
  - Large size, prominent
  - Smooth hover animation
- **Secondary CTA**: Ghost button or link
  - "Learn More →"
  - Less prominent

**Quick Booking Widget (Optional):**
Floating card at bottom of hero section:
```
┌────────────────────────────────────────────────┐
│  Pickup Date  │  Return Date  │  Car Type ▼   │
│  [Calendar]   │  [Calendar]   │  [Dropdown]   │
└───────────────────────────────────────┬────────┘
                                        │ [Search]
```

#### 6.1.3 Featured Vehicles Section

**Design:**
- White or light gray background
- Generous padding (80px top/bottom)
- Container max-width: 1280px
- Card-based layout

**Structure:**
```
Section Title: "Popular Vehicles" or "Featured Fleet"
Subtitle: "Choose from our selection of quality vehicles"

┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   [Image]   │  │   [Image]   │  │   [Image]   │  │   [Image]   │
│             │  │             │  │             │  │             │
│ 2024 Honda  │  │ 2024 Toyota │  │ 2023 Ford   │  │ 2024 Chevy  │
│ Accord      │  │ Camry       │  │ Explorer    │  │ Tahoe       │
│             │  │             │  │             │  │             │
│ Sedan • Auto│  │ Sedan • Auto│  │ SUV • Auto  │  │ SUV • Auto  │
│ ⭐4.8 (23)  │  │ ⭐4.9 (45)  │  │ ⭐4.7 (31)  │  │ ⭐4.9 (18)  │
│             │  │             │  │             │  │             │
│ From $45/day│  │ From $42/day│  │ From $68/day│  │ From $85/day│
│             │  │             │  │             │  │             │
│ [View More] │  │ [View More] │  │ [View More] │  │ [View More] │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘

                    [View All Vehicles →]
```

**Vehicle Card Design:**
- White background
- Rounded corners (12px)
- Subtle shadow
- Hover effect: lift + shadow increase
- Image at top (aspect ratio 4:3 or 16:9)
- Content padding: 20px
- Elements:
  - Vehicle image (optimized, lazy loaded)
  - Vehicle name (Year Make Model)
  - Category badge (small, colored)
  - Key specs row (icons + text)
  - Rating (stars + count)
  - Price (bold, prominent)
  - CTA button

**Grid Layout:**
- Desktop (>1024px): 4 columns
- Tablet (768-1023px): 3 columns
- Mobile (640-767px): 2 columns
- Small mobile (<640px): 1 column

#### 6.1.4 How It Works Section

**Design:**
- Colored or gradient background
- Container max-width: 1280px
- 4-step process visualization

**Structure:**
```
Section Title: "Simple Rental Process"
Subtitle: "Get on the road in four easy steps"

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     [1]      │ ──>│     [2]      │ ──>│     [3]      │ ──>│     [4]      │
│   [Icon]     │    │   [Icon]     │    │   [Icon]     │    │   [Icon]     │
│              │    │              │    │              │    │              │
│ Browse &     │    │ Book &       │    │ Sign &       │    │ Pick Up &    │
│ Select       │    │ Verify       │    │ Pay          │    │ Go           │
│              │    │              │    │              │    │              │
│ Choose your  │    │ Complete     │    │ Digital      │    │ Get keys and │
│ perfect      │    │ booking with │    │ contract and │    │ hit the road │
│ vehicle      │    │ license upload│    │ secure payment│    │             │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

**Step Card Design:**
- Circular number badge (large)
- Icon (64px)
- Title (bold, 20px)
- Description (16px, 2-3 lines)
- Arrow/connector between steps
- Animation on scroll (fade in + slide up)

#### 6.1.5 Why Choose Us Section

**Design:**
- White background
- Grid of benefit cards
- Icons + text

**Structure:**
```
Section Title: "Why Rent With Us"

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   [Icon]    │  │   [Icon]    │  │   [Icon]    │
│             │  │             │  │             │
│ Quality     │  │ Flexible    │  │ Transparent │
│ Fleet       │  │ Rentals     │  │ Pricing     │
│             │  │             │  │             │
│ Description │  │ Description │  │ Description │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   [Icon]    │  │   [Icon]    │  │   [Icon]    │
│             │  │             │  │             │
│ 24/7        │  │ Fully       │  │ Easy        │
│ Support     │  │ Insured     │  │ Booking     │
│             │  │             │  │             │
│ Description │  │ Description │  │ Description │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Benefit Card:**
- Icon (colored, 48px)
- Title (18px, bold)
- Description (14px, 2-3 lines)
- Centered alignment
- Subtle hover effect

#### 6.1.6 Pricing Overview Section

**Design:**
- Light gray background
- Table or card-based pricing display

**Structure:**
```
Section Title: "Transparent Pricing"

┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│  Economy   │  │  Standard  │  │  Premium   │  │   Luxury   │
│            │  │            │  │            │  │            │
│  Starting  │  │  Starting  │  │  Starting  │  │  Starting  │
│  at $35    │  │  at $45    │  │  at $65    │  │  at $95    │
│  per day   │  │  per day   │  │  per day   │  │  per day   │
│            │  │            │  │            │  │            │
│ ✓ Feature  │  │ ✓ Feature  │  │ ✓ Feature  │  │ ✓ Feature  │
│ ✓ Feature  │  │ ✓ Feature  │  │ ✓ Feature  │  │ ✓ Feature  │
│ ✓ Feature  │  │ ✓ Feature  │  │ ✓ Feature  │  │ ✓ Feature  │
└────────────┘  └────────────┘  └────────────┘  └────────────┘

           [View Full Pricing Details →]
```

#### 6.1.7 Statistics Section

**Design:**
- Gradient or colored background
- Large numbers with labels
- Inspired by Extendas.com stats

**Structure:**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    1,250+   │  │    99.9%    │  │     10+     │  │    50,000+  │
│  Customers  │  │   Uptime    │  │   Years     │  │   Rentals   │
│   Served    │  │             │  │ Experience  │  │  Completed  │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

**Stat Display:**
- Very large number (48-60px)
- Bold font weight
- Animated count-up on scroll
- Label below (16px)

#### 6.1.8 Testimonials/Reviews Section

**Design:**
- White background
- Carousel or grid layout
- Customer photos (optional)

**Structure:**
```
Section Title: "What Our Customers Say"

┌────────────────────────────────────────────┐
│ [Photo] "Great experience! The car was     │
│         clean and the process was smooth.  │
│         Highly recommend!"                 │
│                                            │
│         - John D. ⭐⭐⭐⭐⭐              │
└────────────────────────────────────────────┘

[Navigation Dots: ● ○ ○]
```

**Review Card:**
- Customer photo (circular, 64px)
- Quote text (italic, 18px)
- Customer name
- Star rating
- Date (optional)
- Carousel navigation

#### 6.1.9 FAQ Section

**Design:**
- Light background
- Accordion-style expandable items

**Structure:**
```
Section Title: "Frequently Asked Questions"

▼ What do I need to rent a car?
  [Expanded content showing requirements]

▶ What's the minimum age requirement?
▶ Can I extend my rental?
▶ What about insurance?
▶ What's your fuel policy?
▶ What's your cancellation policy?
```

**FAQ Item:**
- Question (16px, bold)
- Expand/collapse icon
- Answer (hidden until expanded)
- Smooth animation
- 8-12 common questions

#### 6.1.10 CTA Section (Before Footer)

**Design:**
- Gradient background
- Centered content
- Final conversion opportunity

**Structure:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│              Ready to Hit the Road?                        │
│          Browse our available vehicles now                 │
│                                                            │
│              [Browse Vehicles] [Contact Us]                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 6.1.11 Footer

**Design:**
- Dark background (navy or dark gray)
- White text
- Multi-column layout
- Comprehensive links

**Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│  [Logo]                      Quick Links    Company    Connect │
│                                                                │
│  Brief company description   • Browse Cars  • About    • FB    │
│                              • Pricing      • Contact  • IG    │
│  ┌──────────────────┐        • How It Works• Careers  • TW    │
│  │ Newsletter       │        • FAQ         • Press    • LI    │
│  │ [Email] [Subscribe]│                                        │
│  └──────────────────┘                                          │
│                                                                │
│  Contact Information:        Legal                            │
│  📞 (555) 123-4567          • Terms of Service                │
│  📧 info@company.com        • Privacy Policy                  │
│  📍 123 Main St, City       • Cookie Policy                   │
│                                                                │
│  © 2026 Company Name. All rights reserved.  [Back to Top ↑]   │
└────────────────────────────────────────────────────────────────┘
```

**Footer Sections:**
1. **Brand Column:**
   - Logo
   - Tagline/description
   - Newsletter signup
   - Social media links

2. **Quick Links:**
   - Browse Cars
   - Pricing
   - How It Works
   - FAQ
   - Blog (if applicable)

3. **Company:**
   - About Us
   - Contact
   - Careers
   - Press/Media

4. **Contact:**
   - Phone number
   - Email
   - Address
   - Business hours

5. **Legal:**
   - Terms of Service
   - Privacy Policy
   - Cookie Policy
   - GDPR/CCPA info

### 6.2 Vehicle Browsing & Search

[Continue with complete vehicle browsing section...]

*(Due to length constraints, I'll create a second file to continue this comprehensive PRD)*

---

*This PRD continues in Part 2 with detailed specifications for:*
- *Complete Vehicle Browsing & Search*
- *Booking Flow with Designs*
- *Customer Dashboard*
- *Admin CRM with Nexus-style Dashboard*
- *All remaining sections*

**Would you like me to:**
1. Create Part 2 of the PRD with remaining sections?
2. Create separate design specification documents?
3. Create wireframes/mockups based on these specs?
4. Start building the actual application based on this PRD?
