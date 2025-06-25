import { z } from 'zod';

/**
 * Validation Schemas for Indian Hotel Management System
 * Includes validation for Indian ID types, phone numbers, and addresses
 */

// Indian phone number validation (+91XXXXXXXXXX)
export const phoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Please enter a valid Indian mobile number (+91XXXXXXXXXX)');

// Indian PIN code validation
export const pinCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Please enter a valid 6-digit PIN code');

// Aadhaar number validation (12 digits)
export const aadhaarSchema = z
  .string()
  .regex(/^\d{12}$/, 'Aadhaar number must be 12 digits');

// PAN number validation (Indian format)
export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number (e.g., ABCDE1234F)');

// Customer validation schema
export const customerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and dots'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  
  phone: phoneSchema,
  
  idType: z.enum(['aadhaar', 'pan', 'passport', 'driving_license', 'voter_id'], {
    required_error: 'Please select an ID type'
  }),
  
  idNumber: z
    .string()
    .min(1, 'ID number is required')
    .max(50, 'ID number must not exceed 50 characters'),
  
  addressLine1: z
    .string()
    .max(200, 'Address line 1 must not exceed 200 characters')
    .optional(),
  
  addressLine2: z
    .string()
    .max(200, 'Address line 2 must not exceed 200 characters')
    .optional(),
  
  city: z
    .string()
    .max(50, 'City name must not exceed 50 characters')
    .optional(),
  
  state: z
    .string()
    .max(50, 'State name must not exceed 50 characters')
    .optional(),
  
  pinCode: z
    .string()
    .regex(/^\d{6}$/, 'PIN code must be 6 digits')
    .optional()
    .or(z.literal('')),
  
  country: z
    .string()
    .default('India')
    .optional()
}).refine((data) => {
  // Custom validation for ID number based on ID type
  if (data.idType === 'aadhaar') {
    return /^\d{12}$/.test(data.idNumber);
  }
  if (data.idType === 'pan') {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.idNumber);
  }
  if (data.idType === 'passport') {
    return /^[A-Z][0-9]{7}$/.test(data.idNumber);
  }
  return data.idNumber.length > 0;
}, {
  message: 'Invalid ID number format for selected ID type',
  path: ['idNumber']
});

// Room validation schema
export const roomSchema = z.object({
  roomNumber: z
    .string()
    .min(1, 'Room number is required')
    .max(10, 'Room number must not exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Room number can only contain letters and numbers'),
  
  roomType: z.enum(['ac-2bed', 'non-ac-2bed', 'ac-3bed', 'non-ac-3bed', 'vip-ac'], {
    required_error: 'Please select a room type'
  }),
  
  baseRate: z
    .number()
    .min(500, 'Base rate must be at least ₹500')
    .max(50000, 'Base rate must not exceed ₹50,000'),
  
  currentRate: z
    .number()
    .min(500, 'Current rate must be at least ₹500')
    .max(50000, 'Current rate must not exceed ₹50,000'),
  
  maxOccupancy: z
    .number()
    .min(1, 'Max occupancy must be at least 1')
    .max(6, 'Max occupancy must not exceed 6'),
  
  amenities: z.array(z.string()).optional().default([])
});

// Booking validation schema
export const bookingSchema = z.object({
  roomId: z
    .string()
    .uuid('Invalid room ID'),
  
  primaryCustomerId: z
    .string()
    .uuid('Invalid customer ID'),
  
  checkInDate: z
    .string()
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Check-in date cannot be in the past'),
  
  checkOutDate: z
    .string()
    .refine((date) => {
      return new Date(date) > new Date();
    }, 'Check-out date must be in the future'),
  
  totalGuests: z
    .number()
    .min(1, 'At least 1 guest is required')
    .max(6, 'Maximum 6 guests allowed'),
  
  roomRate: z
    .number()
    .min(500, 'Room rate must be at least ₹500'),
  
  isGstInclusive: z
    .boolean()
    .default(true),
  
  specialRequests: z
    .string()
    .max(500, 'Special requests must not exceed 500 characters')
    .optional()
}).refine((data) => {
  // Ensure check-out is after check-in
  return new Date(data.checkOutDate) > new Date(data.checkInDate);
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOutDate']
});

// Payment validation schema
export const paymentSchema = z.object({
  bookingId: z
    .string()
    .uuid('Invalid booking ID'),
  
  paymentMethod: z.enum(['cash', 'card', 'upi', 'bank_transfer'], {
    required_error: 'Please select a payment method'
  }),
  
  amount: z
    .number()
    .min(1, 'Payment amount must be greater than 0')
    .max(100000, 'Payment amount must not exceed ₹1,00,000'),
  
  referenceNumber: z
    .string()
    .max(100, 'Reference number must not exceed 100 characters')
    .optional(),
  
  notes: z
    .string()
    .max(300, 'Notes must not exceed 300 characters')
    .optional()
});

// Search validation schema
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must not exceed 100 characters'),
  
  type: z.enum(['customer', 'booking', 'room']).optional()
});

// Date range validation schema
export const dateRangeSchema = z.object({
  startDate: z.string().refine((date) => {
    return !isNaN(Date.parse(date));
  }, 'Invalid start date'),
  
  endDate: z.string().refine((date) => {
    return !isNaN(Date.parse(date));
  }, 'Invalid end date')
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: 'End date must be after start date',
  path: ['endDate']
});

// Export types
export type CustomerFormData = z.infer<typeof customerSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type DateRangeFormData = z.infer<typeof dateRangeSchema>; 