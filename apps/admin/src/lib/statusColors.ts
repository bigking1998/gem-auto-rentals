/**
 * Single source of truth for status badge colours across the admin app.
 *
 * These maps used to be copy-pasted into every page, which is how OPEN ended up
 * blue on the Messages page and green on the Trash page. Import from here — do
 * not redefine a local map.
 *
 * Convention (badge = `bg-*-100 text-*-800`):
 *   yellow = waiting on us / needs action
 *   blue   = acknowledged, work not started
 *   amber  = work in progress
 *   green  = done / good
 *   gray   = terminal, no action
 *   red    = cancelled / failed
 */

export const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const conversationStatusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

export const vehicleStatusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RENTED: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  UNAVAILABLE: 'bg-gray-100 text-gray-800',
};

/** Fallback for an unrecognised status, so a badge never renders unstyled. */
export const unknownStatusColor = 'bg-gray-100 text-gray-800';

export function statusColor(map: Record<string, string>, status?: string | null): string {
  if (!status) return unknownStatusColor;
  return map[status] ?? unknownStatusColor;
}
