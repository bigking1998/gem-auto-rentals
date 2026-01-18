import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSchema,
} from '../auth';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional rememberMe field', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    const validRegisterData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      password: 'Password1',
      confirmPassword: 'Password1',
      agreeToTerms: true as const,
    };

    it('should validate correct registration data', () => {
      const result = registerSchema.safeParse(validRegisterData);
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase letter', () => {
      const invalidData = {
        ...validRegisterData,
        password: 'password1',
        confirmPassword: 'password1',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase letter', () => {
      const invalidData = {
        ...validRegisterData,
        password: 'PASSWORD1',
        confirmPassword: 'PASSWORD1',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const invalidData = {
        ...validRegisterData,
        password: 'Password',
        confirmPassword: 'Password',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        ...validRegisterData,
        password: 'Pass1',
        confirmPassword: 'Pass1',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        ...validRegisterData,
        password: 'Password1',
        confirmPassword: 'Password2',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Passwords do not match');
      }
    });

    it('should reject when agreeToTerms is false', () => {
      const invalidData = {
        ...validRegisterData,
        agreeToTerms: false,
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short first name', () => {
      const invalidData = {
        ...validRegisterData,
        firstName: 'J',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        ...validRegisterData,
        phone: '123',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept various valid phone formats', () => {
      const phoneFormats = [
        '+1 (555) 123-4567',
        '555-123-4567',
        '5551234567',
        '+44 20 7123 4567',
      ];

      phoneFormats.forEach((phone) => {
        const data = { ...validRegisterData, phone };
        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate correct email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = forgotPasswordSchema.safeParse({ email: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate matching strong passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPassword1',
        confirmPassword: 'NewPassword1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPassword1',
        confirmPassword: 'DifferentPassword1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('profileSchema', () => {
    const validProfileData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
    };

    it('should validate correct profile data', () => {
      const result = profileSchema.safeParse(validProfileData);
      expect(result.success).toBe(true);
    });

    it('should accept optional address fields', () => {
      const dataWithAddress = {
        ...validProfileData,
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };
      const result = profileSchema.safeParse(dataWithAddress);
      expect(result.success).toBe(true);
    });

    it('should accept optional date of birth', () => {
      const dataWithDob = {
        ...validProfileData,
        dateOfBirth: '1990-01-15',
      };
      const result = profileSchema.safeParse(dataWithDob);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email in profile', () => {
      const invalidData = {
        ...validProfileData,
        email: 'invalid',
      };
      const result = profileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
