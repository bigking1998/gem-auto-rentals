import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  dateLocationSchema,
  extrasSchema,
  customerInfoSchema,
  paymentSchema,
  fullBookingSchema,
} from '../booking';

describe('Booking Validation Schemas', () => {
  describe('dateLocationSchema', () => {
    // Mock date to ensure consistent test results
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const validDateData = {
      startDate: formatDate(tomorrow),
      endDate: formatDate(nextWeek),
      pickupTime: '10:00',
      dropoffTime: '10:00',
      pickupLocation: 'Downtown Office',
      dropoffLocation: 'Downtown Office',
    };

    it('should validate correct date and location data', () => {
      const result = dateLocationSchema.safeParse(validDateData);
      expect(result.success).toBe(true);
    });

    it('should reject when return date is before pickup date', () => {
      const invalidData = {
        ...validDateData,
        startDate: formatDate(nextWeek),
        endDate: formatDate(tomorrow),
      };
      const result = dateLocationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Return date must be after pick-up date');
      }
    });

    it('should reject when pickup date is in the past', () => {
      const invalidData = {
        ...validDateData,
        startDate: formatDate(yesterday),
      };
      const result = dateLocationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Pick-up date cannot be in the past');
      }
    });

    it('should reject missing pickup location', () => {
      const invalidData = {
        ...validDateData,
        pickupLocation: '',
      };
      const result = dateLocationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing dropoff location', () => {
      const invalidData = {
        ...validDateData,
        dropoffLocation: '',
      };
      const result = dateLocationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing pickup time', () => {
      const invalidData = {
        ...validDateData,
        pickupTime: '',
      };
      const result = dateLocationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow different pickup and dropoff locations', () => {
      const validData = {
        ...validDateData,
        pickupLocation: 'Airport Terminal',
        dropoffLocation: 'Downtown Office',
      };
      const result = dateLocationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('extrasSchema', () => {
    it('should validate all extras selected', () => {
      const allExtras = {
        insurance: true,
        gps: true,
        childSeat: true,
        additionalDriver: true,
      };
      const result = extrasSchema.safeParse(allExtras);
      expect(result.success).toBe(true);
    });

    it('should validate no extras selected', () => {
      const noExtras = {
        insurance: false,
        gps: false,
        childSeat: false,
        additionalDriver: false,
      };
      const result = extrasSchema.safeParse(noExtras);
      expect(result.success).toBe(true);
    });

    it('should validate partial extras', () => {
      const partialExtras = {
        insurance: true,
        gps: false,
        childSeat: true,
        additionalDriver: false,
      };
      const result = extrasSchema.safeParse(partialExtras);
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean values', () => {
      const invalidData = {
        insurance: 'yes',
        gps: false,
        childSeat: false,
        additionalDriver: false,
      };
      const result = extrasSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('customerInfoSchema', () => {
    // Create a date that makes someone 25 years old
    const twentyFiveYearsAgo = new Date();
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);

    // Create a date that makes someone 20 years old (under 21)
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);

    const validCustomerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street',
      city: 'New York',
      zipCode: '10001',
      country: 'USA',
      driversLicense: 'DL123456789',
      dateOfBirth: twentyFiveYearsAgo.toISOString().split('T')[0],
      agreeToTerms: true as const,
    };

    it('should validate correct customer data', () => {
      const result = customerInfoSchema.safeParse(validCustomerData);
      expect(result.success).toBe(true);
    });

    it('should reject customer under 21 years old', () => {
      const underageData = {
        ...validCustomerData,
        dateOfBirth: twentyYearsAgo.toISOString().split('T')[0],
      };
      const result = customerInfoSchema.safeParse(underageData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'You must be at least 21 years old to rent a vehicle'
        );
      }
    });

    it('should reject short drivers license', () => {
      const invalidData = {
        ...validCustomerData,
        driversLicense: 'DL12',
      };
      const result = customerInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        ...validCustomerData,
        email: 'invalid-email',
      };
      const result = customerInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const missingFields = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = customerInfoSchema.safeParse(missingFields);
      expect(result.success).toBe(false);
    });

    it('should reject when terms not agreed', () => {
      const notAgreed = {
        ...validCustomerData,
        agreeToTerms: false,
      };
      const result = customerInfoSchema.safeParse(notAgreed);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentSchema', () => {
    const validPaymentData = {
      cardNumber: '4242 4242 4242 4242',
      expiryDate: '12/25',
      cvc: '123',
      cardholderName: 'John Doe',
    };

    it('should validate correct payment data', () => {
      const result = paymentSchema.safeParse(validPaymentData);
      expect(result.success).toBe(true);
    });

    it('should accept card number without spaces', () => {
      const noSpaces = {
        ...validPaymentData,
        cardNumber: '4242424242424242',
      };
      const result = paymentSchema.safeParse(noSpaces);
      expect(result.success).toBe(true);
    });

    it('should accept 4-digit CVC (Amex)', () => {
      const amexCvc = {
        ...validPaymentData,
        cvc: '1234',
      };
      const result = paymentSchema.safeParse(amexCvc);
      expect(result.success).toBe(true);
    });

    it('should reject invalid card number', () => {
      const invalidCard = {
        ...validPaymentData,
        cardNumber: '1234',
      };
      const result = paymentSchema.safeParse(invalidCard);
      expect(result.success).toBe(false);
    });

    it('should reject invalid expiry date format', () => {
      const invalidExpiry = {
        ...validPaymentData,
        expiryDate: '2025-12',
      };
      const result = paymentSchema.safeParse(invalidExpiry);
      expect(result.success).toBe(false);
    });

    it('should reject invalid month in expiry', () => {
      const invalidMonth = {
        ...validPaymentData,
        expiryDate: '13/25',
      };
      const result = paymentSchema.safeParse(invalidMonth);
      expect(result.success).toBe(false);
    });

    it('should reject short CVC', () => {
      const shortCvc = {
        ...validPaymentData,
        cvc: '12',
      };
      const result = paymentSchema.safeParse(shortCvc);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric CVC', () => {
      const alphaCvc = {
        ...validPaymentData,
        cvc: 'abc',
      };
      const result = paymentSchema.safeParse(alphaCvc);
      expect(result.success).toBe(false);
    });

    it('should reject short cardholder name', () => {
      const shortName = {
        ...validPaymentData,
        cardholderName: 'J',
      };
      const result = paymentSchema.safeParse(shortName);
      expect(result.success).toBe(false);
    });
  });

  describe('fullBookingSchema', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const validFullBooking = {
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      pickupTime: '10:00',
      dropoffTime: '10:00',
      pickupLocation: 'Downtown',
      dropoffLocation: 'Downtown',
      extras: {
        insurance: true,
        gps: false,
        childSeat: false,
        additionalDriver: false,
      },
      customer: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'USA',
        driversLicense: 'DL123456789',
        dateOfBirth: '1990-01-15',
      },
      vehicleId: 'vehicle-123',
      totalAmount: 350.00,
    };

    it('should validate complete booking data', () => {
      const result = fullBookingSchema.safeParse(validFullBooking);
      expect(result.success).toBe(true);
    });

    it('should reject missing vehicle ID', () => {
      const missingVehicle = {
        ...validFullBooking,
        vehicleId: '',
      };
      const result = fullBookingSchema.safeParse(missingVehicle);
      expect(result.success).toBe(false);
    });

    it('should reject zero or negative total amount', () => {
      const invalidAmount = {
        ...validFullBooking,
        totalAmount: 0,
      };
      const result = fullBookingSchema.safeParse(invalidAmount);
      expect(result.success).toBe(false);
    });

    it('should reject negative total amount', () => {
      const negativeAmount = {
        ...validFullBooking,
        totalAmount: -50,
      };
      const result = fullBookingSchema.safeParse(negativeAmount);
      expect(result.success).toBe(false);
    });
  });
});
