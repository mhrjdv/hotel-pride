import { z } from 'zod';
import { useState, useEffect } from 'react';

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  indianPhone: /^(\+91|91)?[6-9]\d{9}$/,
  gstNumber: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  panNumber: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  aadhaarNumber: /^\d{12}$/,
  pincode: /^\d{6}$/,
  invoiceNumber: /^INV-\d{4}-\d{4}$/,
  bookingNumber: /^BK\d{8}$/,
} as const;

// Validation functions
export const ValidationHelpers = {
  isValidEmail: (email: string): boolean => {
    return ValidationPatterns.email.test(email);
  },

  isValidIndianPhone: (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return ValidationPatterns.indianPhone.test(cleaned);
  },

  isValidGSTNumber: (gst: string): boolean => {
    return ValidationPatterns.gstNumber.test(gst.toUpperCase());
  },

  isValidPANNumber: (pan: string): boolean => {
    return ValidationPatterns.panNumber.test(pan.toUpperCase());
  },

  isValidAadhaarNumber: (aadhaar: string): boolean => {
    const cleaned = aadhaar.replace(/\s/g, '');
    return ValidationPatterns.aadhaarNumber.test(cleaned);
  },

  isValidPincode: (pincode: string): boolean => {
    return ValidationPatterns.pincode.test(pincode);
  },

  isValidAmount: (amount: number): boolean => {
    return amount >= 0 && amount <= 999999999.99;
  },

  isValidPercentage: (percentage: number): boolean => {
    return percentage >= 0 && percentage <= 100;
  },

  isValidDate: (date: string): boolean => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed.getFullYear() >= 1900;
  },

  isValidDateRange: (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  },

  sanitizeString: (str: string): string => {
    return str.trim().replace(/\s+/g, ' ');
  },

  sanitizePhone: (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, '');
  },

  formatIndianPhone: (phone: string): string => {
    const cleaned = ValidationHelpers.sanitizePhone(phone);
    if (cleaned.startsWith('+91')) return cleaned;
    if (cleaned.startsWith('91')) return `+${cleaned}`;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return phone;
  },

  formatGSTNumber: (gst: string): string => {
    return gst.toUpperCase().replace(/\s/g, '');
  },

  formatPANNumber: (pan: string): string => {
    return pan.toUpperCase().replace(/\s/g, '');
  },

  formatAadhaarNumber: (aadhaar: string): string => {
    const cleaned = aadhaar.replace(/\s/g, '');
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  },
} as const;

// Zod schemas for common validations
export const CommonSchemas = {
  email: z.string().email('Invalid email address'),
  
  indianPhone: z.string().refine(
    (phone) => ValidationHelpers.isValidIndianPhone(phone),
    'Invalid Indian phone number'
  ),

  gstNumber: z.string().optional().refine(
    (gst) => !gst || ValidationHelpers.isValidGSTNumber(gst),
    'Invalid GST number format'
  ),

  panNumber: z.string().optional().refine(
    (pan) => !pan || ValidationHelpers.isValidPANNumber(pan),
    'Invalid PAN number format'
  ),

  aadhaarNumber: z.string().optional().refine(
    (aadhaar) => !aadhaar || ValidationHelpers.isValidAadhaarNumber(aadhaar),
    'Invalid Aadhaar number format'
  ),

  pincode: z.string().refine(
    (pincode) => ValidationHelpers.isValidPincode(pincode),
    'Invalid PIN code'
  ),

  amount: z.number().min(0, 'Amount cannot be negative').max(999999999.99, 'Amount too large'),

  percentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Percentage cannot exceed 100'),

  positiveInteger: z.number().int().positive('Must be a positive integer'),

  nonNegativeInteger: z.number().int().min(0, 'Must be non-negative'),

  dateString: z.string().refine(
    (date) => ValidationHelpers.isValidDate(date),
    'Invalid date format'
  ),

  futureDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Date must be in the future'
  ),

  pastDate: z.string().refine(
    (date) => new Date(date) < new Date(),
    'Date must be in the past'
  ),

  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters'),

  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters'),

  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must not exceed 1000 characters'),

  notes: z.string()
    .max(2000, 'Notes must not exceed 2000 characters')
    .optional(),
} as const;

// Validation error formatter
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formatted[path] = error.message;
  });
  
  return formatted;
}

// Async validation helpers
export const AsyncValidation = {
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/validation/email-exists?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data.exists;
    } catch {
      return false;
    }
  },

  checkPhoneExists: async (phone: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/validation/phone-exists?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      return data.exists;
    } catch {
      return false;
    }
  },

  checkInvoiceNumberExists: async (invoiceNumber: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/validation/invoice-exists?number=${encodeURIComponent(invoiceNumber)}`);
      const data = await response.json();
      return data.exists;
    } catch {
      return false;
    }
  },
} as const;

// Form validation helpers
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatValidationErrors(error) };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

// Real-time validation hook
export function useFieldValidation<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  debounceMs: number = 300
) {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsValidating(true);
      try {
        schema.parse(value);
        setError(null);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setError(err.errors[0]?.message || 'Invalid value');
        }
      } finally {
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, schema, debounceMs]);

  return { error, isValidating };
}

// Business logic validations
export const BusinessValidation = {
  canCheckIn: (checkInDate: string, checkInTime: string): boolean => {
    const checkIn = new Date(`${checkInDate}T${checkInTime}`);
    const now = new Date();
    const diffHours = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= -24; // Allow check-in up to 24 hours late
  },

  canCheckOut: (checkOutDate: string, checkOutTime: string): boolean => {
    const checkOut = new Date(`${checkOutDate}T${checkOutTime}`);
    const now = new Date();
    return checkOut <= now;
  },

  isValidBookingDuration: (checkIn: string, checkOut: string): boolean => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 1 && diffDays <= 365; // 1 day to 1 year
  },

  isValidPaymentAmount: (amount: number, totalAmount: number, paidAmount: number): boolean => {
    const remainingAmount = totalAmount - paidAmount;
    return amount > 0 && amount <= remainingAmount;
  },

  isValidDiscountAmount: (discount: number, baseAmount: number): boolean => {
    return discount >= 0 && discount <= baseAmount;
  },

  isValidTaxRate: (taxRate: number): boolean => {
    return taxRate >= 0 && taxRate <= 50; // Max 50% tax
  },
} as const;
