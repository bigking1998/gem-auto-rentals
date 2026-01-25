# Gem Auto Rentals - Admin Dashboard Implementation Plan

> **Purpose:** Complete the admin dashboard CRM functionality by building out all partially working and non-functional features.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Status Overview](#feature-status-overview)
3. [Phase 1: Messages & Communications System](#phase-1-messages--communications-system)
4. [Phase 2: Security & Session Management](#phase-2-security--session-management)
5. [Phase 3: Settings Completion](#phase-3-settings-completion)
6. [Phase 4: Notification System](#phase-4-notification-system)
7. [Phase 5: External Integrations](#phase-5-external-integrations)
8. [Database Schema Changes](#database-schema-changes)
9. [API Endpoints Summary](#api-endpoints-summary)
10. [Frontend Components Summary](#frontend-components-summary)
11. [Testing Checklist](#testing-checklist)

---

## Executive Summary

### Current State
The admin dashboard has **strong core functionality** (fleet, bookings, customers, payments, analytics) but several features exist only as UI mockups without backend integration.

### Goal
Transform the admin dashboard into a **fully functional CRM** where every feature connects to the database and provides real business value.

### Scope of Work

| Priority | Feature | Effort Estimate | Business Impact |
|----------|---------|-----------------|-----------------|
| 🔴 High | Messages System | Large | Critical for customer communication |
| 🔴 High | Activity/Audit Logging | Medium | Security & compliance |
| 🟡 Medium | Session Management | Medium | Security monitoring |
| 🟡 Medium | Notification Preferences | Medium | Customer experience |
| 🟡 Medium | Settings - Billing | Medium | Admin convenience |
| 🟢 Low | Two-Factor Authentication | Large | Enhanced security |
| 🟢 Low | External Integrations | Large | Marketing automation |

---

## Feature Status Overview

### ⚠️ Partially Working Features

| Feature | Working | Not Working |
|---------|---------|-------------|
| **Settings Page** | Profile updates, password change | Billing/invoices, integrations, notifications |
| **Customer Profile** | Basic info, booking history | Document verification UI connection, communication history |

### ❌ Non-Functional Features (UI Only)

| Feature | Current State | Required Work |
|---------|--------------|---------------|
| **Messages** | Hardcoded mock data | Full backend implementation |
| **Security Page** | Mock sessions & login history | Session tracking, activity logging |
| **Two-Factor Auth** | UI toggle only | TOTP/SMS implementation |
| **Integrations** | Mock connection toggles | OAuth flows, webhooks |

---

## Phase 1: Messages & Communications System

### Overview
Build a complete internal messaging system for staff-to-customer communication, including email integration.

### 1.1 Database Schema

```prisma
// Add to prisma/schema.prisma

model Conversation {
  id            String    @id @default(cuid())

  // Participants
  customerId    String
  customer      User      @relation("CustomerConversations", fields: [customerId], references: [id])

  // Metadata
  subject       String?
  status        ConversationStatus @default(OPEN)
  priority      Priority           @default(NORMAL)

  // Assignment
  assignedToId  String?
  assignedTo    User?     @relation("AssignedConversations", fields: [assignedToId], references: [id])

  // Related entities (optional)
  bookingId     String?
  booking       Booking?  @relation(fields: [bookingId], references: [id])

  // Timestamps
  lastMessageAt DateTime  @default(now())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  messages      Message[]

  @@index([customerId])
  @@index([assignedToId])
  @@index([status])
  @@index([lastMessageAt])
}

model Message {
  id              String    @id @default(cuid())

  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  // Sender
  senderId        String
  sender          User      @relation(fields: [senderId], references: [id])
  senderType      SenderType // CUSTOMER, STAFF, SYSTEM

  // Content
  content         String    @db.Text
  contentType     MessageContentType @default(TEXT)

  // Attachments
  attachments     MessageAttachment[]

  // Status
  readAt          DateTime?

  // Email tracking (if sent via email)
  emailMessageId  String?   // External email ID for threading

  createdAt       DateTime  @default(now())

  @@index([conversationId])
  @@index([senderId])
  @@index([createdAt])
}

model MessageAttachment {
  id          String   @id @default(cuid())
  messageId   String
  message     Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  fileName    String
  fileUrl     String
  fileSize    Int
  mimeType    String

  createdAt   DateTime @default(now())

  @@index([messageId])
}

enum ConversationStatus {
  OPEN
  PENDING
  RESOLVED
  CLOSED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum SenderType {
  CUSTOMER
  STAFF
  SYSTEM
}

enum MessageContentType {
  TEXT
  HTML
  TEMPLATE
}
```

### 1.2 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/conversations` | List all conversations (with filters) | Staff |
| `GET` | `/api/conversations/:id` | Get conversation with messages | Staff |
| `POST` | `/api/conversations` | Create new conversation | Staff |
| `PATCH` | `/api/conversations/:id` | Update conversation (status, assignment, priority) | Staff |
| `DELETE` | `/api/conversations/:id` | Archive/delete conversation | Admin |
| `POST` | `/api/conversations/:id/messages` | Send a message | Staff |
| `PATCH` | `/api/messages/:id/read` | Mark message as read | Staff |
| `GET` | `/api/conversations/unread-count` | Get unread message count | Staff |
| `POST` | `/api/conversations/:id/assign` | Assign conversation to staff | Staff |

### 1.3 Backend Implementation

**File: `server/src/routes/conversations.ts`**

```typescript
// Endpoints to implement:

// GET /api/conversations
// - Query params: status, assignedTo, customerId, search, page, limit
// - Returns paginated list with last message preview
// - Include unread count per conversation

// GET /api/conversations/:id
// - Include all messages (paginated)
// - Include customer info
// - Include related booking if exists

// POST /api/conversations
// - Create conversation with initial message
// - Optionally link to booking
// - Send email notification to customer

// POST /api/conversations/:id/messages
// - Add message to conversation
// - Update conversation.lastMessageAt
// - Send email notification to recipient
// - Handle attachments (upload to Supabase)

// PATCH /api/conversations/:id
// - Update status, priority, assignment
// - Log status changes as system messages
```

### 1.4 Frontend Components

**Files to modify/create in `apps/admin/src/`:**

| File | Changes |
|------|---------|
| `pages/MessagesPage.tsx` | Replace mock data with real API calls |
| `components/messages/ConversationList.tsx` | New - Sidebar list of conversations |
| `components/messages/ConversationView.tsx` | New - Message thread display |
| `components/messages/MessageComposer.tsx` | New - Rich text editor for replies |
| `components/messages/ConversationFilters.tsx` | New - Status/assignment filters |
| `lib/api.ts` | Add conversation API methods |

### 1.5 Email Integration

```typescript
// server/src/services/email.ts

// Add methods:
// - sendMessageNotification(to, conversation, message)
// - Email templates for:
//   - New message from staff
//   - Conversation resolved
//   - Follow-up reminder
```

### 1.6 Acceptance Criteria

- [ ] Staff can view all customer conversations
- [ ] Staff can filter by status (Open, Pending, Resolved, Closed)
- [ ] Staff can search conversations by customer name/email
- [ ] Staff can assign conversations to themselves or others
- [ ] Staff can send messages with text content
- [ ] Staff can attach files to messages
- [ ] Customers receive email notifications for new messages
- [ ] Unread count shows in sidebar badge
- [ ] Conversations can be linked to bookings
- [ ] System messages log status changes

---

## Phase 2: Security & Session Management

### Overview
Implement real session tracking, login activity logging, and audit trails for security compliance.

### 2.1 Database Schema

```prisma
// Add to prisma/schema.prisma

model Session {
  id            String    @id @default(cuid())

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Session info
  token         String    @unique  // Hashed JWT or session ID

  // Device/location info
  userAgent     String?
  ipAddress     String?
  device        String?   // Parsed from user agent
  browser       String?   // Parsed from user agent
  os            String?   // Parsed from user agent
  location      String?   // Geo-IP lookup

  // Status
  isActive      Boolean   @default(true)
  lastActiveAt  DateTime  @default(now())
  expiresAt     DateTime
  revokedAt     DateTime?
  revokedReason String?

  createdAt     DateTime  @default(now())

  @@index([userId])
  @@index([token])
  @@index([isActive])
  @@index([lastActiveAt])
}

model ActivityLog {
  id          String    @id @default(cuid())

  // Actor
  userId      String?
  user        User?     @relation(fields: [userId], references: [id])

  // Action details
  action      ActivityAction
  entityType  String?   // User, Vehicle, Booking, etc.
  entityId    String?

  // Context
  description String
  metadata    Json?     // Additional context data

  // Request info
  ipAddress   String?
  userAgent   String?

  // Status
  status      ActivityStatus @default(SUCCESS)
  errorMessage String?

  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
}

enum ActivityAction {
  // Auth
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_CHANGE
  PASSWORD_RESET
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED

  // Users
  USER_CREATE
  USER_UPDATE
  USER_DELETE
  ROLE_CHANGE

  // Vehicles
  VEHICLE_CREATE
  VEHICLE_UPDATE
  VEHICLE_DELETE
  VEHICLE_STATUS_CHANGE

  // Bookings
  BOOKING_CREATE
  BOOKING_UPDATE
  BOOKING_CANCEL
  BOOKING_STATUS_CHANGE
  CONTRACT_UPLOAD

  // Payments
  PAYMENT_PROCESS
  PAYMENT_REFUND

  // Documents
  DOCUMENT_UPLOAD
  DOCUMENT_VERIFY
  DOCUMENT_REJECT

  // Messages
  CONVERSATION_CREATE
  MESSAGE_SEND

  // Settings
  SETTINGS_UPDATE
}

enum ActivityStatus {
  SUCCESS
  FAILURE
  PENDING
}
```

### 2.2 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/sessions` | List active sessions for current user | User |
| `GET` | `/api/sessions/all` | List all sessions (admin view) | Admin |
| `DELETE` | `/api/sessions/:id` | Revoke specific session | User (own) / Admin |
| `DELETE` | `/api/sessions/all` | Revoke all sessions except current | User |
| `GET` | `/api/activity` | Get activity logs (with filters) | Staff |
| `GET` | `/api/activity/user/:userId` | Get activity for specific user | Staff |
| `GET` | `/api/activity/entity/:type/:id` | Get activity for entity | Staff |

### 2.3 Backend Implementation

**File: `server/src/middleware/sessionTracking.ts`**

```typescript
// Middleware to:
// - Create session record on login
// - Update lastActiveAt on each request
// - Parse user agent for device info
// - Get IP and geo-location

// Functions:
// - createSession(userId, token, req)
// - updateSessionActivity(token)
// - revokeSession(sessionId, reason)
// - cleanupExpiredSessions() // Cron job
```

**File: `server/src/services/activityLogger.ts`**

```typescript
// Service to log all actions:
// - logActivity(action, userId, entityType, entityId, metadata, req)
// - Called from route handlers after successful operations
// - Include IP, user agent, status
```

**File: `server/src/routes/sessions.ts`**

```typescript
// Session management endpoints
```

**File: `server/src/routes/activity.ts`**

```typescript
// Activity log endpoints with filtering
```

### 2.4 Frontend Components

**Files to modify/create:**

| File | Changes |
|------|---------|
| `pages/SecurityPage.tsx` | Replace mock data with real API calls |
| `components/security/SessionList.tsx` | Display active sessions with revoke |
| `components/security/ActivityLog.tsx` | Display activity history |
| `components/security/SessionDetails.tsx` | Device, location, time details |
| `lib/api.ts` | Add session and activity API methods |

### 2.5 Acceptance Criteria

- [ ] Login creates a session record with device info
- [ ] Sessions list shows all active sessions for user
- [ ] Users can revoke individual sessions
- [ ] Users can revoke all other sessions
- [ ] Admin can view all user sessions
- [ ] Activity log records all significant actions
- [ ] Activity log is filterable by action type, user, date range
- [ ] Activity includes IP address and user agent
- [ ] Failed login attempts are logged
- [ ] Expired sessions are automatically cleaned up

---

## Phase 3: Settings Completion

### Overview
Complete the Settings page with real billing data, working notification preferences, and company settings.

### 3.1 Database Schema

```prisma
// Add to prisma/schema.prisma

model UserPreferences {
  id                    String   @id @default(cuid())

  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Email notifications
  emailBookingConfirm   Boolean  @default(true)
  emailBookingReminder  Boolean  @default(true)
  emailPaymentReceipt   Boolean  @default(true)
  emailPromotions       Boolean  @default(false)
  emailNewsletter       Boolean  @default(false)

  // Push notifications (future)
  pushEnabled           Boolean  @default(false)

  // SMS notifications
  smsBookingReminder    Boolean  @default(false)
  smsPaymentAlert       Boolean  @default(false)

  // Preferences
  language              String   @default("en")
  timezone              String   @default("America/New_York")
  dateFormat            String   @default("MM/DD/YYYY")
  currency              String   @default("USD")

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model CompanySettings {
  id                    String   @id @default(cuid())

  // Company info
  companyName           String   @default("Gem Auto Rentals")
  companyEmail          String?
  companyPhone          String?
  companyAddress        String?
  companyLogo           String?

  // Business settings
  defaultCurrency       String   @default("USD")
  defaultTimezone       String   @default("America/New_York")
  taxRate               Decimal  @default(0) @db.Decimal(5, 4)

  // Booking settings
  minBookingHours       Int      @default(24)
  maxBookingDays        Int      @default(30)
  cancellationHours     Int      @default(24)  // Free cancellation window
  depositPercentage     Decimal  @default(0.20) @db.Decimal(3, 2)

  // Operating hours (JSON)
  operatingHours        Json?

  // Terms & policies
  termsOfService        String?  @db.Text
  privacyPolicy         String?  @db.Text
  cancellationPolicy    String?  @db.Text

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model Invoice {
  id              String    @id @default(cuid())

  // Related entities
  bookingId       String?
  booking         Booking?  @relation(fields: [bookingId], references: [id])

  customerId      String
  customer        User      @relation(fields: [customerId], references: [id])

  // Invoice details
  invoiceNumber   String    @unique
  status          InvoiceStatus @default(DRAFT)

  // Amounts
  subtotal        Decimal   @db.Decimal(10, 2)
  taxAmount       Decimal   @db.Decimal(10, 2)
  discountAmount  Decimal   @default(0) @db.Decimal(10, 2)
  totalAmount     Decimal   @db.Decimal(10, 2)

  // Line items (JSON array)
  lineItems       Json

  // Dates
  issueDate       DateTime  @default(now())
  dueDate         DateTime
  paidAt          DateTime?

  // Payment
  paymentId       String?

  // PDF
  pdfUrl          String?

  notes           String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([customerId])
  @@index([bookingId])
  @@index([status])
  @@index([invoiceNumber])
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
  REFUNDED
}
```

### 3.2 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/users/:id/preferences` | Get user preferences | User (own) / Staff |
| `PUT` | `/api/users/:id/preferences` | Update user preferences | User (own) / Staff |
| `GET` | `/api/settings/company` | Get company settings | Staff |
| `PUT` | `/api/settings/company` | Update company settings | Admin |
| `GET` | `/api/invoices` | List invoices | Staff |
| `GET` | `/api/invoices/:id` | Get invoice details | Staff |
| `POST` | `/api/invoices` | Create invoice | Staff |
| `PUT` | `/api/invoices/:id` | Update invoice | Staff |
| `POST` | `/api/invoices/:id/send` | Send invoice to customer | Staff |
| `GET` | `/api/invoices/:id/pdf` | Generate/download PDF | Staff |

### 3.3 Frontend Updates

| File | Changes |
|------|---------|
| `pages/SettingsPage.tsx` | Connect to real APIs |
| `components/settings/NotificationSettings.tsx` | Real preference toggle states |
| `components/settings/BillingSettings.tsx` | Real invoice list, payment methods |
| `components/settings/CompanySettings.tsx` | New - Company info management |
| `components/settings/InvoiceList.tsx` | New - Invoice management |

### 3.4 Acceptance Criteria

- [ ] User preferences save to database
- [ ] Notification toggles persist and affect email sending
- [ ] Company settings configurable by admin
- [ ] Invoice list shows real invoices from bookings
- [ ] Invoices can be generated as PDFs
- [ ] Invoices can be sent via email
- [ ] Tax calculations use company settings

---

## Phase 4: Notification System

### Overview
Build a centralized notification system for emails, in-app notifications, and SMS.

### 4.1 Database Schema

```prisma
// Add to prisma/schema.prisma

model Notification {
  id            String    @id @default(cuid())

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Content
  type          NotificationType
  title         String
  message       String

  // Related entity
  entityType    String?
  entityId      String?
  actionUrl     String?   // Deep link in app

  // Delivery status
  channels      NotificationChannel[]
  emailSent     Boolean   @default(false)
  emailSentAt   DateTime?
  smsSent       Boolean   @default(false)
  smsSentAt     DateTime?

  // Read status
  readAt        DateTime?

  createdAt     DateTime  @default(now())

  @@index([userId])
  @@index([type])
  @@index([readAt])
  @@index([createdAt])
}

enum NotificationType {
  // Bookings
  BOOKING_CONFIRMED
  BOOKING_REMINDER
  BOOKING_STARTED
  BOOKING_ENDING_SOON
  BOOKING_COMPLETED
  BOOKING_CANCELLED

  // Payments
  PAYMENT_RECEIVED
  PAYMENT_FAILED
  PAYMENT_REFUNDED
  INVOICE_SENT
  INVOICE_OVERDUE

  // Documents
  DOCUMENT_VERIFIED
  DOCUMENT_REJECTED
  DOCUMENT_EXPIRING

  // Messages
  NEW_MESSAGE
  CONVERSATION_ASSIGNED

  // System
  SYSTEM_ANNOUNCEMENT
  MAINTENANCE_ALERT
}

enum NotificationChannel {
  IN_APP
  EMAIL
  SMS
  PUSH
}
```

### 4.2 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/notifications` | List user notifications | User |
| `GET` | `/api/notifications/unread-count` | Get unread count | User |
| `PATCH` | `/api/notifications/:id/read` | Mark as read | User |
| `PATCH` | `/api/notifications/read-all` | Mark all as read | User |
| `DELETE` | `/api/notifications/:id` | Delete notification | User |

### 4.3 Backend Implementation

**File: `server/src/services/notificationService.ts`**

```typescript
// Central notification service:

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  channels: NotificationChannel[];
}

// Methods:
// - sendNotification(payload): Creates notification, sends via configured channels
// - sendBulkNotification(userIds[], payload): For announcements
// - sendBookingReminders(): Cron job for upcoming bookings
// - sendPaymentReminders(): Cron job for overdue payments
// - sendDocumentExpiryReminders(): Cron job for expiring documents
```

### 4.4 Email Templates

Create templates in `server/src/templates/emails/`:

- `booking-confirmed.html`
- `booking-reminder.html`
- `booking-completed.html`
- `payment-receipt.html`
- `payment-failed.html`
- `invoice.html`
- `document-verified.html`
- `document-rejected.html`
- `new-message.html`

### 4.5 Cron Jobs

```typescript
// server/src/jobs/notifications.ts

// Schedule:
// - Every hour: Check for booking reminders (24h before pickup)
// - Every day: Check for document expiry (30 days before)
// - Every day: Check for overdue invoices
// - Every 6 hours: Check for ending rentals (24h before return)
```

### 4.6 Frontend Components

| File | Changes |
|------|---------|
| `components/layout/Header.tsx` | Add notification bell with badge |
| `components/notifications/NotificationDropdown.tsx` | New - Dropdown list |
| `components/notifications/NotificationItem.tsx` | New - Individual notification |
| `pages/NotificationsPage.tsx` | New - Full notification history |

### 4.7 Acceptance Criteria

- [ ] In-app notifications appear in header dropdown
- [ ] Unread badge shows count
- [ ] Notifications link to relevant pages
- [ ] Email notifications respect user preferences
- [ ] Booking reminders sent 24h before pickup
- [ ] Payment receipts sent on successful payment
- [ ] Document verification status notifications work
- [ ] Bulk mark-as-read functionality

---

## Phase 5: External Integrations

### Overview
Implement real OAuth connections and webhook handlers for third-party services.

### 5.1 Database Schema

```prisma
// Add to prisma/schema.prisma

model Integration {
  id              String    @id @default(cuid())

  // Integration type
  provider        IntegrationProvider

  // Status
  isEnabled       Boolean   @default(false)
  isConnected     Boolean   @default(false)

  // OAuth tokens (encrypted)
  accessToken     String?
  refreshToken    String?
  tokenExpiresAt  DateTime?

  // Provider-specific config
  config          Json?

  // Metadata
  connectedAt     DateTime?
  lastSyncAt      DateTime?
  lastError       String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([provider])
}

enum IntegrationProvider {
  STRIPE
  PAYPAL
  MAILCHIMP
  TWILIO
  GOOGLE_CALENDAR
  QUICKBOOKS
  ZAPIER
}

model WebhookLog {
  id              String    @id @default(cuid())

  provider        IntegrationProvider

  // Request details
  eventType       String
  payload         Json

  // Processing
  status          WebhookStatus @default(PENDING)
  processedAt     DateTime?
  errorMessage    String?
  retryCount      Int       @default(0)

  createdAt       DateTime  @default(now())

  @@index([provider])
  @@index([status])
  @@index([createdAt])
}

enum WebhookStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### 5.2 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/integrations` | List all integrations | Admin |
| `GET` | `/api/integrations/:provider` | Get integration status | Admin |
| `POST` | `/api/integrations/:provider/connect` | Start OAuth flow | Admin |
| `GET` | `/api/integrations/:provider/callback` | OAuth callback | Public |
| `POST` | `/api/integrations/:provider/disconnect` | Disconnect integration | Admin |
| `PUT` | `/api/integrations/:provider/config` | Update config | Admin |
| `POST` | `/api/integrations/:provider/test` | Test connection | Admin |
| `POST` | `/api/webhooks/:provider` | Webhook endpoint | Public (verified) |

### 5.3 Integration Implementations

**Stripe (Payment Processing)** - Already partially implemented
- Enhance with subscription billing
- Add invoice sync
- Webhook handling for payment events

**PayPal (Alternative Payments)**
- OAuth connection
- Payment processing alternative
- Webhook handling

**Mailchimp (Email Marketing)**
- OAuth connection
- Sync customers to audience
- Tag customers by booking status
- Automated campaign triggers

**Twilio (SMS)**
- API key configuration
- Send booking reminders via SMS
- Two-factor authentication codes

**Google Calendar**
- OAuth connection
- Sync bookings to calendar
- Block out vehicle availability

**QuickBooks (Accounting)**
- OAuth connection
- Sync invoices
- Sync customer records
- Revenue reporting

### 5.4 Frontend Components

| File | Changes |
|------|---------|
| `pages/SettingsPage.tsx` | Real integration statuses |
| `components/settings/IntegrationCard.tsx` | Connect/disconnect buttons |
| `components/settings/IntegrationConfig.tsx` | Provider-specific settings |

### 5.5 Acceptance Criteria

- [ ] Integration cards show real connection status
- [ ] OAuth flow works for each provider
- [ ] Tokens are securely stored (encrypted)
- [ ] Refresh tokens automatically renew access
- [ ] Webhooks are verified and logged
- [ ] Failed webhooks retry with backoff
- [ ] Admin can disconnect integrations
- [ ] Test connection functionality works

---

## Database Schema Changes

### Summary of New Models

```prisma
// Complete list of models to add to prisma/schema.prisma

// Phase 1: Messages
model Conversation { ... }
model Message { ... }
model MessageAttachment { ... }

// Phase 2: Security
model Session { ... }
model ActivityLog { ... }

// Phase 3: Settings
model UserPreferences { ... }
model CompanySettings { ... }
model Invoice { ... }

// Phase 4: Notifications
model Notification { ... }

// Phase 5: Integrations
model Integration { ... }
model WebhookLog { ... }
```

### User Model Updates

```prisma
// Add relations to existing User model

model User {
  // ... existing fields ...

  // New relations
  preferences           UserPreferences?
  sessions              Session[]
  activityLogs          ActivityLog[]
  notifications         Notification[]

  // Conversations
  customerConversations Conversation[] @relation("CustomerConversations")
  assignedConversations Conversation[] @relation("AssignedConversations")
  sentMessages          Message[]

  // Invoices
  invoices              Invoice[]
}
```

### Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name add_crm_features

# Generate Prisma client
npx prisma generate
```

---

## API Endpoints Summary

### New Route Files

| File | Endpoints |
|------|-----------|
| `server/src/routes/conversations.ts` | 9 endpoints |
| `server/src/routes/sessions.ts` | 4 endpoints |
| `server/src/routes/activity.ts` | 3 endpoints |
| `server/src/routes/preferences.ts` | 2 endpoints |
| `server/src/routes/invoices.ts` | 6 endpoints |
| `server/src/routes/notifications.ts` | 5 endpoints |
| `server/src/routes/integrations.ts` | 7 endpoints |
| `server/src/routes/webhooks.ts` | 1 endpoint per provider |

### Total New Endpoints: ~40

---

## Frontend Components Summary

### New Pages

| Page | Route | Purpose |
|------|-------|---------|
| `NotificationsPage.tsx` | `/notifications` | Full notification history |

### Modified Pages

| Page | Changes |
|------|---------|
| `MessagesPage.tsx` | Replace mock with real API |
| `SecurityPage.tsx` | Replace mock with real API |
| `SettingsPage.tsx` | Connect all sections to API |

### New Components

| Component | Purpose |
|-----------|---------|
| `ConversationList.tsx` | Message sidebar |
| `ConversationView.tsx` | Message thread |
| `MessageComposer.tsx` | Reply editor |
| `SessionList.tsx` | Active sessions |
| `ActivityLog.tsx` | Activity history |
| `NotificationDropdown.tsx` | Header notifications |
| `NotificationItem.tsx` | Single notification |
| `IntegrationCard.tsx` | Integration status |
| `InvoiceList.tsx` | Invoice management |

---

## Testing Checklist

### Phase 1: Messages
- [ ] Create conversation via API
- [ ] Send message via API
- [ ] List conversations with pagination
- [ ] Filter by status
- [ ] Assign conversation
- [ ] Email notification sends
- [ ] File attachment uploads
- [ ] Unread count updates

### Phase 2: Security
- [ ] Session created on login
- [ ] Session list accurate
- [ ] Revoke session works
- [ ] Activity logged for all actions
- [ ] Activity filters work
- [ ] Failed login logged

### Phase 3: Settings
- [ ] Preferences save correctly
- [ ] Company settings save
- [ ] Invoice generation works
- [ ] Invoice PDF downloads
- [ ] Tax calculation correct

### Phase 4: Notifications
- [ ] In-app notification created
- [ ] Email sent based on preferences
- [ ] Unread count correct
- [ ] Mark as read works
- [ ] Cron jobs execute

### Phase 5: Integrations
- [ ] OAuth flow completes
- [ ] Tokens stored securely
- [ ] Webhook received
- [ ] Webhook processed
- [ ] Integration disconnect works

---

## Implementation Order

### Recommended Sequence

1. **Database migrations** - Add all new schemas first
2. **Phase 2: Security** - Activity logging needed for audit trail
3. **Phase 1: Messages** - High business value
4. **Phase 3: Settings** - Preferences affect other features
5. **Phase 4: Notifications** - Depends on preferences
6. **Phase 5: Integrations** - Can be done incrementally

### Dependencies

```
Security (Activity Logging)
    ↓
Messages ←→ Notifications
    ↓           ↓
Settings (Preferences)
    ↓
Integrations
```

---

## Notes

- All new endpoints should use the existing authentication middleware
- Follow existing code patterns in `server/src/routes/`
- Use Zod for request validation (existing pattern)
- Use existing Supabase storage for file uploads
- Email sending uses existing Resend integration
- All dates should be stored in UTC

---

*Document created: January 2025*
*Last updated: January 2025*

---

## Technical Review & Robustness Findings

### 1. recent Codebase Updates (Gap Analysis)
Recent work has implemented the following features which were listed as "Non-Functional":
- **Customer Deletion**: Connected to API and working.
- **Booking Deletion**: Connected to API and working.
- **Booking Edit**: Connected to API (price recalculation active).
- **Customer Edit**: Wired to Profile view.

**Action Item**: The implementation of "Phase 2: Security" (logging) should immediately instrument these newly active features to ensure audit trails are captured from Day 1.

### 2. Manual Payments & Invoicing
The "Payment Tracking" modal requires backend support for non-Stripe payments (Cash, Wire).
- **Recommendation**: Accelerate **Phase 3 (Invoicing)**.
- **Robustness Add**:
    - Extend `PaymentMethod` enum in `Payment` model to include `CASH`, `CHECK`, `WIRE`.
    - Allow creating a `Payment` record with `status: SUCCEEDED` directly for manual payments if the user is an Admin.
    - Link these manual payments to the `Invoice` model for generation of receipts.

### 3. Data Integrity & Concurrency
- **Booking Edits**: Moving a booking's dates (handled in `PATCH /api/bookings/:id`) currently performs an availability check.
    - **Risk**: Race conditions if two admins edit bookings simultaneously.
    - **Fix**: Use Prisma Transaction with `optimistic concurrency control` (using a version field or checking `updatedAt`) or stricter database locking during the check-then-update phase.

### 4. Security & Performance
- **Activity Logs**:
    - **Risk**: Infinite growth of the `ActivityLog` table.
    - **Mitigation**: Implement a retention policy (e.g., Cron job to archive/delete logs > 1 year old).
    - **Rate Limiting**: New endpoints (especially `POST /api/messages` and `POST /api/conversations`) must be rate-limited to prevent spam/abuse, even from authenticated staff accounts (compromised account protection).

### 5. Notification Reliability
- **Risk**: Critical notifications (Booking Confirmations) relying on casual execution.
- **Mitigation**: Implement a queue system (e.g., BullMQ) for `Notification` delivery rather than direct synchronous calls. This ensures retries if the email provider (Resend) is temporary down.

### 6. Secrets Management
- **Integrations**: Storing OAuth tokens requires encryption at rest.
- **Action**: Ensure `ENCRYPTION_KEY` is added to `.env` and use AES-256 for the `accessToken` and `refreshToken` fields in the `Integration` model.
