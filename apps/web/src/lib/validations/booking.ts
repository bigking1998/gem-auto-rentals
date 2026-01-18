import { z } from 'zod';

// Date & Location step schema
export const dateLocationSchema = z
  .object({
    startDate: z.string().min(1, 'Pick-up date is required'),
    endDate: z.string().min(1, 'Return date is required'),
    pickupTime: z.string().min(1, 'Pick-up time is required'),
    dropoffTime: z.string().min(1, 'Return time is required'),
    pickupLocation: z.string().min(1, 'Pick-up location is required'),
    dropoffLocation: z.string().min(1, 'Return location is required'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'Return date must be after pick-up date',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },
    {
      message: 'Pick-up date cannot be in the past',
      path: ['startDate'],
    }
  );

export type DateLocationFormData = z.infer<typeof dateLocationSchema>;

// Extras step schema
export const extrasSchema = z.object({
  insurance: z.boolean(),
  gps: z.boolean(),
  childSeat: z.boolean(),
  additionalDriver: z.boolean(),
});

export type ExtrasFormData = z.infer<typeof extrasSchema>;

// Customer info step schema
export const customerInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s()-]{10,}$/, 'Please enter a valid phone number'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  driversLicense: z
    .string()
    .min(1, "Driver's license number is required")
    .min(5, "Driver's license must be at least 5 characters"),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(
      (date) => {
        const dob = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        return age >= 21;
      },
      { message: 'You must be at least 21 years old to rent a vehicle' }
    ),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
  }),
});

export type CustomerInfoFormData = z.infer<typeof customerInfoSchema>;

// Payment step schema
export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^[\d\s]{13,19}$/, 'Please enter a valid card number'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Please enter a valid expiry date (MM/YY)'),
  cvc: z
    .string()
    .min(1, 'CVC is required')
    .regex(/^\d{3,4}$/, 'Please enter a valid CVC'),
  cardholderName: z
    .string()
    .min(1, 'Cardholder name is required')
    .min(2, 'Please enter the full name on the card'),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// Full booking schema (combines all steps)
export const fullBookingSchema = z.object({
  // Date & Location
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  pickupTime: z.string().min(1),
  dropoffTime: z.string().min(1),
  pickupLocation: z.string().min(1),
  dropoffLocation: z.string().min(1),

  // Extras
  extras: extrasSchema,

  // Customer Info
  customer: customerInfoSchema.omit({ agreeToTerms: true }),

  // Vehicle
  vehicleId: z.string().min(1),
  totalAmount: z.number().positive(),
});

export type FullBookingFormData = z.infer<typeof fullBookingSchema>;
