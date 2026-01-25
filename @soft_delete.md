# Soft Delete / Recycle Bin Feature

## Overview
Add soft delete (recycle bin) functionality to the Gem Auto Rentals CRM. Records will be flagged as deleted rather than permanently removed, allowing recovery within a configurable retention period (default 30 days).

---

## Phase 1: Database Schema

- [ ] Add `deletedAt` and `deletedBy` fields to User model
- [ ] Add `deletedAt` and `deletedBy` fields to Vehicle model
- [ ] Add `deletedAt` and `deletedBy` fields to Booking model
- [ ] Add `deletedAt` and `deletedBy` fields to Document model
- [ ] Add `deletedAt` and `deletedBy` fields to Conversation model
- [ ] Add `deletedAt` and `deletedBy` fields to Invoice model
- [ ] Add `deletedAt` and `deletedBy` fields to Review model
- [ ] Add `deletedAt` and `deletedBy` fields to MaintenanceRecord model
- [ ] Add `@@index([deletedAt])` to each soft-deletable model
- [ ] Add restore actions to ActivityAction enum (USER_RESTORE, VEHICLE_RESTORE, etc.)
- [ ] Run database migration

## Phase 2: Prisma Soft Delete Middleware

- [ ] Create `server/src/lib/softDelete.ts` middleware file
- [ ] Implement query filtering (auto-exclude deletedAt != null)
- [ ] Implement delete interception (convert delete to update)
- [ ] Implement deleteMany interception
- [ ] Add `includeDeleted` flag support for bypassing filter
- [ ] Add `findDeleted()` helper method
- [ ] Add `restore()` helper method
- [ ] Add `hardDelete()` helper method
- [ ] Update `server/src/lib/prisma.ts` to apply middleware

## Phase 3: Trash API Routes

- [ ] Create `server/src/routes/trash.ts` route file
- [ ] Implement `GET /api/trash` - summary counts by entity type
- [ ] Implement `GET /api/trash/:entityType` - list deleted items (paginated)
- [ ] Implement `POST /api/trash/:entityType/:id/restore` - restore single item
- [ ] Implement `DELETE /api/trash/:entityType/:id/permanent` - hard delete
- [ ] Implement `POST /api/trash/empty` - empty all trash (admin only)
- [ ] Register trash routes in `server/src/index.ts`

## Phase 4: Update Existing DELETE Endpoints

- [ ] Update `vehicles.ts` DELETE endpoint - set deletedBy
- [ ] Update `customers.ts` DELETE endpoint - set deletedBy
- [ ] Update `bookings.ts` DELETE endpoint - set deletedBy
- [ ] Update `documents.ts` DELETE endpoint - set deletedBy
- [ ] Update `conversations.ts` DELETE endpoint - set deletedBy
- [ ] Update `invoices.ts` DELETE endpoint (if exists) - set deletedBy
- [ ] Add activity logging for soft delete and restore actions

## Phase 5: Admin Dashboard UI

- [ ] Create `apps/admin/src/pages/TrashPage.tsx` component
- [ ] Add entity type tabs (Users, Vehicles, Bookings, etc.)
- [ ] Add summary counts display
- [ ] Add search within deleted items
- [ ] Add restore button with confirmation
- [ ] Add permanent delete button with confirmation
- [ ] Add "Empty Trash" button (admin only)
- [ ] Display deletion date and who deleted
- [ ] Add trash API methods to `apps/admin/src/lib/api.ts`
- [ ] Add route in `apps/admin/src/App.tsx`
- [ ] Add navigation item in `DashboardLayout.tsx`

## Phase 6: Scheduled Cleanup Job

- [ ] Create `server/src/jobs/cleanupDeletedRecords.ts`
- [ ] Implement retention period logic (SOFT_DELETE_RETENTION_DAYS env var)
- [ ] Handle deletion in dependency order (children first)
- [ ] Clean up associated Supabase Storage files
- [ ] Add npm script for manual cleanup
- [ ] Document cron setup for automated cleanup

## Phase 7: Testing & Verification

- [ ] Test soft delete via admin dashboard
- [ ] Test restore functionality
- [ ] Test permanent delete
- [ ] Test that deleted records don't appear in normal queries
- [ ] Test unique constraint handling (can create user with deleted email)
- [ ] Test cascade behavior
- [ ] Verify activity logs for delete/restore actions

---

## Models Reference

| Model | Soft Delete | Reason |
|-------|-------------|--------|
| User | Yes | Core entity with history |
| Vehicle | Yes | Fleet asset with records |
| Booking | Yes | Financial audit trail |
| Document | Yes | Compliance records |
| Conversation | Yes | Communication history |
| Invoice | Yes | Legal/tax records |
| Review | Yes | Customer feedback |
| MaintenanceRecord | Yes | Service history |
| Session | No | Security - hard revoke |
| Notification | No | Ephemeral |
| Payment | No | Keep with booking |

## Key Files

- `server/prisma/schema.prisma` - Add deletedAt/deletedBy fields
- `server/src/lib/softDelete.ts` - New middleware (create)
- `server/src/lib/prisma.ts` - Apply middleware
- `server/src/routes/trash.ts` - New API routes (create)
- `server/src/index.ts` - Register routes
- `apps/admin/src/pages/TrashPage.tsx` - New UI (create)
- `apps/admin/src/lib/api.ts` - Add trash methods

---

---RALPH_STATUS---
STATUS: NOT_STARTED
LOOPS_COMPLETED: 0
BACKEND_STATUS: PENDING
FRONTEND_STATUS: PENDING
DATABASE_MIGRATION: PENDING
EXIT_SIGNAL: false
RECOMMENDATION: Start with Phase 1 - Add soft delete fields to Prisma schema
---END_RALPH_STATUS---
