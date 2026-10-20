import { describe, it, expect } from 'vitest';
import { calculateTotal, EXTRA_PRICES_PER_DAY, SECURITY_DEPOSIT } from '../routes/bookings.js';

/**
 * Pricing regression tests.
 *
 * These exist because the booking suite asserts only that a `total` PROPERTY is
 * present — it never checks the number. So the whole suite passed while the
 * prices were wrong, which is the most expensive kind of green build: the
 * customer is shown one figure and charged another, and it surfaces as a
 * chargeback rather than a failing test.
 *
 * The browser has its own copy of these numbers in
 * `apps/web/src/lib/extras.ts`. If you change one side, change both.
 */
const day = 24 * 60 * 60 * 1000;
const start = new Date('2026-01-01T10:00:00Z');
const threeDays = new Date(start.getTime() + 3 * day);

describe('calculateTotal', () => {
  it('charges the daily rate plus the deposit when no extras are chosen', () => {
    expect(calculateTotal(50, start, threeDays, {})).toBe(50 * 3 + SECURITY_DEPOSIT);
  });

  it('adds $5/day for a child seat', () => {
    expect(calculateTotal(50, start, threeDays, { childSeat: true })).toBe(
      50 * 3 + 5 * 3 + SECURITY_DEPOSIT
    );
    expect(EXTRA_PRICES_PER_DAY.childSeat).toBe(5);
  });

  it('adds $5/day for an additional driver', () => {
    expect(calculateTotal(50, start, threeDays, { additionalDriver: true })).toBe(
      50 * 3 + 5 * 3 + SECURITY_DEPOSIT
    );
    expect(EXTRA_PRICES_PER_DAY.additionalDriver).toBe(5);
  });

  it('charges both extras together', () => {
    expect(calculateTotal(50, start, threeDays, { childSeat: true, additionalDriver: true })).toBe(
      50 * 3 + 5 * 3 + 5 * 3 + SECURITY_DEPOSIT
    );
  });

  // The two products that were withdrawn. A crafted request must not be able to
  // buy something we do not sell.
  it('never charges for insurance, even if the flag is set', () => {
    expect(calculateTotal(50, start, threeDays, { insurance: true })).toBe(
      50 * 3 + SECURITY_DEPOSIT
    );
  });

  it('never charges for GPS, even if the flag is set', () => {
    expect(calculateTotal(50, start, threeDays, { gps: true })).toBe(50 * 3 + SECURITY_DEPOSIT);
  });

  it('applies the $100 refundable deposit exactly once, not per day', () => {
    const oneDay = calculateTotal(50, start, new Date(start.getTime() + day), {});
    const sixDays = calculateTotal(50, start, new Date(start.getTime() + 6 * day), {});
    expect(oneDay).toBe(50 + 100);
    expect(sixDays).toBe(300 + 100);
    expect(SECURITY_DEPOSIT).toBe(100);
  });
});
