/**
 * Single source of truth for booking extras and the security deposit.
 *
 * These prices used to be written out by hand in THREE places — the catalogue in
 * ExtrasStep, `calculateExtrasTotal` in the same file, and `calculateTotal` plus
 * the summary JSX in BookingPage. That is the same duplication that left four
 * different phone numbers on this site. Import from here instead.
 *
 * ⚠️  THE SERVER RECALCULATES THE TOTAL INDEPENDENTLY.
 * `server/src/routes/bookings.ts` → `calculateTotal()` has its own copy of these
 * numbers and it is the one that decides what the customer is actually charged.
 * **If you change a price here, change it there in the same commit**, or the
 * customer will be shown one figure and billed another.
 */

export interface ExtraOption {
  id: ExtraId;
  name: string;
  description: string;
  pricePerDay: number;
  popular?: boolean;
  /** When false the option is shown but cannot be selected, and is never charged. */
  available: boolean;
  /** Why it cannot be selected. Shown to the customer in place of the price. */
  unavailableNote?: string;
  benefits: string[];
}

export type ExtraId = 'insurance' | 'childSeat' | 'additionalDriver';

/**
 * Refundable security deposit, in dollars. Flat, not a percentage.
 *
 * NOTE: `BusinessSettings.depositPercentage` in the Prisma schema is a separate,
 * unrelated percentage-based setting that nothing in the booking flow reads. This
 * is the flat deposit the owner asked for on 2026-10-20.
 */
export const SECURITY_DEPOSIT = 100;

export const EXTRAS: ExtraOption[] = [
  {
    // 2026-10-20 — UNAVAILABLE at the owner's instruction: "we're not giving them
    // that option of full insurance". Greyed out rather than deleted so the
    // customer can see it exists and ask, and so re-enabling it is one flag.
    //
    // The earlier copy promised "Comprehensive protection ... Zero deductible" and
    // listed a collision damage waiver and third-party liability. None of that was
    // ever checked against a policy. Restore specifics ONLY from the policy document.
    id: 'insurance',
    name: 'Damage Protection',
    description:
      'Not available to add online at the moment. Ask a team member about damage protection when they confirm your booking.',
    pricePerDay: 0,
    available: false,
    unavailableNote: 'Currently unavailable — ask us',
    benefits: ['Ask a team member when you book'],
  },
  {
    id: 'childSeat',
    name: 'Child Seat',
    description: 'Safety-certified child seat suitable for children aged 1-4 years (9-18 kg).',
    pricePerDay: 5,
    available: true,
    benefits: ['Age 1-4 years', 'Safety certified', 'Easy installation'],
  },
  {
    id: 'additionalDriver',
    name: 'Additional Driver',
    description:
      'Add another driver to your rental. The additional driver must be 21 or over and present a valid licence.',
    pricePerDay: 5,
    available: true,
    // "Fully insured" / "Same coverage applies" removed with the insurance claim —
    // we cannot state coverage we have not verified.
    benefits: ['Share driving duties', 'Must be 21+ with a valid licence'],
  },
];

/** Only the options a customer can actually choose. */
export const SELECTABLE_EXTRAS = EXTRAS.filter((e) => e.available);

/** Price lookup, in dollars per day. Unavailable options are always 0. */
export const EXTRA_PRICES: Record<ExtraId, number> = EXTRAS.reduce(
  (acc, e) => {
    acc[e.id] = e.available ? e.pricePerDay : 0;
    return acc;
  },
  {} as Record<ExtraId, number>
);

/**
 * Total for the selected extras across the whole rental.
 * An unavailable option contributes nothing even if its flag is somehow set.
 */
export function calculateExtrasTotal(
  selected: Partial<Record<ExtraId, boolean>>,
  days: number
): number {
  return EXTRAS.reduce(
    (sum, e) => (e.available && selected[e.id] ? sum + e.pricePerDay * days : sum),
    0
  );
}
