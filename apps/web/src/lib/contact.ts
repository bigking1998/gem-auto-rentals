/**
 * Single source of truth for Gem Car Rentals' public contact details.
 *
 * These used to be duplicated (and drift) across ContactPage, Footer,
 * CTASection and VehicleDetailPage — VehicleDetailPage was still showing the
 * placeholder `+1 (555) 123-4567`. Import from here instead of retyping.
 */

export const CONTACT_EMAIL = 'gemautosalesinc@gmail.com';

/** Main line, as displayed. */
export const PRIMARY_PHONE = '863-277-7879';
/** Main line, as a `tel:` href target. */
export const PRIMARY_PHONE_HREF = 'tel:+18632777879';

/** Secondary line, as displayed. */
export const SECONDARY_PHONE = '863-279-2907';
/** Secondary line, as a `tel:` href target. */
export const SECONDARY_PHONE_HREF = 'tel:+18632792907';

export const ADDRESS = '1311 E CANAL ST, MULBERRY, FL 33860';

export const BUSINESS_NAME = 'Gem Car Rentals';
