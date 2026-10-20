/**
 * Single source of truth for Gem Car Rentals' public contact details.
 *
 * These used to be duplicated (and drift) across ContactPage, Footer,
 * CTASection and VehicleDetailPage — VehicleDetailPage was still showing the
 * placeholder `+1 (555) 123-4567`. Import from here instead of retyping.
 *
 * 2026-10-20 — CONSOLIDATED TO ONE NUMBER, on the owner's instruction:
 * "any phone number that is different from the phone number that I gave you
 * please change it ... I want it to all come to [863-277-6712], whether it's
 * text messages, calls".
 *
 * This is not cosmetic. 863-277-6712 is the number provisioned in GoHighLevel
 * as the Default Number and registered A2P. Every other number that used to be
 * on this site (863-277-7879, 863-279-2907, 813-422-4539, and a fake vanity
 * `1-800-GEM-AUTO`) reaches a line that is NOT A2P-registered and NOT connected
 * to the CRM — so a text to it fires no workflow, creates no contact and alerts
 * nobody. Do not reintroduce a second number without wiring it up first.
 */

export const CONTACT_EMAIL = 'Bookings@Gemrentalcars.com';

/** The only line. Calls and texts both land here, and it is A2P-registered. */
export const PRIMARY_PHONE = '863-277-6712';
/** The only line, as a `tel:` href target. */
export const PRIMARY_PHONE_HREF = 'tel:+18632776712';

/**
 * @deprecated There is no second line any more. These aliases exist only so
 * older imports keep compiling; they resolve to the primary number. Prefer
 * PRIMARY_PHONE and delete the call site's "secondary" rendering.
 */
export const SECONDARY_PHONE = PRIMARY_PHONE;
/** @deprecated See SECONDARY_PHONE. */
export const SECONDARY_PHONE_HREF = PRIMARY_PHONE_HREF;

export const ADDRESS = '1311 E CANAL ST, MULBERRY, FL 33860';

export const BUSINESS_NAME = 'Gem Car Rentals';
