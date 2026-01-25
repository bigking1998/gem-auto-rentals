# Soft Delete / Recycle Bin Feature

## Overview
Add soft delete (recycle bin) functionality to the Gem Auto Rentals CRM. Records will be flagged as deleted rather than permanently removed, allowing recovery within a configurable retention period (default 30 days).

---

## Phase 1: Database Schema

- [x] Add `deletedAt` and `deletedBy` fields to User model
- [x] Add `deletedAt` and `deletedBy` fields to Vehicle model
- [x] Add `deletedAt` and `deletedBy` fields to Booking model
- [x] Add `deletedAt` and `deletedBy` fields to Document model
- [x] Add `deletedAt` and `deletedBy` fields to Conversation model
- [x] Add `deletedAt` and `deletedBy` fields to Invoice model
- [x] Add `deletedAt` and `deletedBy` fields to Review model
- [x] Add `deletedAt` and `deletedBy` fields to MaintenanceRecord model
- [x] Add `@@index([deletedAt])` to each soft-deletable model
- [x] Add restore actions to ActivityAction enum (USER_RESTORE, VEHICLE_RESTORE, etc.)
- [x] Run database migration

## Phase 2: Prisma Soft Delete Middleware

- [x] Create `server/src/lib/softDelete.ts` middleware file
- [x] Implement query filtering (auto-exclude deletedAt != null)
- [x] Implement delete interception (convert delete to update)
- [x] Implement deleteMany interception
- [x] Add `includeDeleted` flag support for bypassing filter
- [x] Add `findDeleted()` helper method
- [x] Add `restore()` helper method
- [x] Add `hardDelete()` helper method
- [x] Update `server/src/lib/prisma.ts` to apply middleware

## Phase 3: Trash API Routes

- [x] Create `server/src/routes/trash.ts` route file
- [x] Implement `GET /api/trash` - summary counts by entity type
- [x] Implement `GET /api/trash/:entityType` - list deleted items (paginated)
- [x] Implement `POST /api/trash/:entityType/:id/restore` - restore single item
- [x] Implement `DELETE /api/trash/:entityType/:id/permanent` - hard delete
- [x] Implement `POST /api/trash/empty` - empty all trash (admin only)
- [x] Register trash routes in `server/src/index.ts`

## Phase 4: Update Existing DELETE Endpoints

- [x] Update `vehicles.ts` DELETE endpoint - set deletedBy
- [x] Update `customers.ts` DELETE endpoint - set deletedBy
- [x] Update `bookings.ts` DELETE endpoint - set deletedBy
- [x] Update `documents.ts` DELETE endpoint - set deletedBy
- [x] Update `conversations.ts` DELETE endpoint - set deletedBy
- [x] Update `invoices.ts` DELETE endpoint (if exists) - set deletedBy
- [x] Add activity logging for soft delete and restore actions

## Phase 5: Admin Dashboard UI

- [x] Create `apps/admin/src/pages/TrashPage.tsx` component
- [x] Add entity type tabs (Users, Vehicles, Bookings, etc.)
- [x] Add summary counts display
- [x] Add search within deleted items
- [x] Add restore button with confirmation
- [x] Add permanent delete button with confirmation
- [x] Add "Empty Trash" button (admin only)
- [x] Display deletion date and who deleted
- [x] Add trash API methods to `apps/admin/src/lib/api.ts`
- [x] Add route in `apps/admin/src/App.tsx`
- [x] Add navigation item in `Sidebar.tsx`

## Phase 6: Scheduled Cleanup Job

- [x] Create `server/src/jobs/cleanupDeletedRecords.ts`
- [x] Implement retention period logic (SOFT_DELETE_RETENTION_DAYS env var)
- [x] Handle deletion in dependency order (children first)
- [x] Clean up associated Supabase Storage files
- [x] Add npm script for manual cleanup
- [x] Document cron setup for automated cleanup

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
- `server/src/jobs/cleanupDeletedRecords.ts` - Cleanup job

## Usage

### Manual Cleanup
```bash
# Dry run (preview without deleting)
npm run cleanup:deleted:dry

# Actual cleanup
npm run cleanup:deleted
```

### Environment Variables
```
SOFT_DELETE_RETENTION_DAYS=30  # Days before permanent deletion (default: 30)
DRY_RUN=true                   # Preview mode without actual deletion
```

### Cron Setup (Production)
Add to crontab for daily cleanup at 3 AM:
```
0 3 * * * cd /path/to/server && npm run cleanup:deleted >> /var/log/cleanup.log 2>&1
```

---

---RALPH_STATUS---
STATUS: TESTING
LOOPS_COMPLETED: 6
BACKEND_STATUS: COMPLETE
FRONTEND_STATUS: COMPLETE
DATABASE_MIGRATION: COMPLETE
EXIT_SIGNAL: false
RECOMMENDATION: Run tests and verify all soft delete functionality works correctly
---END_RALPH_STATUS---
