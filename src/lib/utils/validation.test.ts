import { describe, expect, it } from 'vitest';
import { ValidationHelpers, BusinessValidation, validateForm } from './validation';
import { z } from 'zod';

describe('ValidationHelpers.isValidIndianPhone', () => {
  it('accepts a bare 10-digit mobile', () => {
    expect(ValidationHelpers.isValidIndianPhone('9876543210')).toBe(true);
  });
  it('accepts a +91-prefixed number', () => {
    expect(ValidationHelpers.isValidIndianPhone('+919876543210')).toBe(true);
  });
  it('accepts a 91-prefixed number', () => {
    expect(ValidationHelpers.isValidIndianPhone('919876543210')).toBe(true);
  });
  it('accepts a number with spaces/dashes (sanitized)', () => {
    expect(ValidationHelpers.isValidIndianPhone('98765-43210')).toBe(true);
  });
  it('rejects a number starting below 6', () => {
    expect(ValidationHelpers.isValidIndianPhone('5876543210')).toBe(false);
  });
  it('rejects a too-short number', () => {
    expect(ValidationHelpers.isValidIndianPhone('98765')).toBe(false);
  });
});

describe('ValidationHelpers.formatIndianPhone', () => {
  it('prefixes a bare 10-digit number with +91', () => {
    expect(ValidationHelpers.formatIndianPhone('9876543210')).toBe('+919876543210');
  });
  it('adds a + to a 91-prefixed number', () => {
    expect(ValidationHelpers.formatIndianPhone('919876543210')).toBe('+919876543210');
  });
  it('leaves a +91 number unchanged', () => {
    expect(ValidationHelpers.formatIndianPhone('+919876543210')).toBe('+919876543210');
  });
});

describe('ValidationHelpers ID validators', () => {
  it('validates PAN case-insensitively', () => {
    expect(ValidationHelpers.isValidPANNumber('abcde1234f')).toBe(true);
    expect(ValidationHelpers.isValidPANNumber('ABCD1234F')).toBe(false);
  });
  it('validates Aadhaar (ignoring spaces)', () => {
    expect(ValidationHelpers.isValidAadhaarNumber('1234 1234 1234')).toBe(true);
    expect(ValidationHelpers.isValidAadhaarNumber('1234')).toBe(false);
  });
  it('validates a GST number', () => {
    expect(ValidationHelpers.isValidGSTNumber('27ABCDE1234F1Z5')).toBe(true);
    expect(ValidationHelpers.isValidGSTNumber('BADGST')).toBe(false);
  });
  it('validates a PIN code', () => {
    expect(ValidationHelpers.isValidPincode('400001')).toBe(true);
    expect(ValidationHelpers.isValidPincode('4000')).toBe(false);
  });
  it('formats an Aadhaar number into 4-4-4 groups', () => {
    expect(ValidationHelpers.formatAadhaarNumber('123412341234')).toBe('1234 1234 1234');
  });
});

describe('ValidationHelpers numeric / date validators', () => {
  it('bounds valid amounts', () => {
    expect(ValidationHelpers.isValidAmount(0)).toBe(true);
    expect(ValidationHelpers.isValidAmount(-1)).toBe(false);
    expect(ValidationHelpers.isValidAmount(1000000000)).toBe(false);
  });
  it('bounds valid percentages', () => {
    expect(ValidationHelpers.isValidPercentage(50)).toBe(true);
    expect(ValidationHelpers.isValidPercentage(101)).toBe(false);
    expect(ValidationHelpers.isValidPercentage(-1)).toBe(false);
  });
  it('validates date strings and a date range', () => {
    expect(ValidationHelpers.isValidDate('2026-06-28')).toBe(true);
    expect(ValidationHelpers.isValidDate('not-a-date')).toBe(false);
    expect(ValidationHelpers.isValidDateRange('2026-01-01', '2026-02-01')).toBe(true);
    expect(ValidationHelpers.isValidDateRange('2026-02-01', '2026-01-01')).toBe(false);
  });
  it('sanitizes whitespace in strings', () => {
    expect(ValidationHelpers.sanitizeString('  a   b  ')).toBe('a b');
  });
});

describe('BusinessValidation', () => {
  it('isValidBookingDuration accepts 1..365 nights only', () => {
    expect(BusinessValidation.isValidBookingDuration('2026-01-01', '2026-01-02')).toBe(true);
    expect(BusinessValidation.isValidBookingDuration('2026-01-01', '2026-01-01')).toBe(false); // 0 nights
    expect(BusinessValidation.isValidBookingDuration('2026-01-01', '2028-01-01')).toBe(false); // > 365
  });
  it('isValidPaymentAmount checks remaining balance', () => {
    expect(BusinessValidation.isValidPaymentAmount(500, 1000, 200)).toBe(true); // remaining 800
    expect(BusinessValidation.isValidPaymentAmount(900, 1000, 200)).toBe(false); // exceeds remaining
    expect(BusinessValidation.isValidPaymentAmount(0, 1000, 0)).toBe(false);
  });
  it('isValidDiscountAmount caps discount at the base amount', () => {
    expect(BusinessValidation.isValidDiscountAmount(100, 1000)).toBe(true);
    expect(BusinessValidation.isValidDiscountAmount(1100, 1000)).toBe(false);
    expect(BusinessValidation.isValidDiscountAmount(-1, 1000)).toBe(false);
  });
  it('isValidTaxRate caps at 50%', () => {
    expect(BusinessValidation.isValidTaxRate(28)).toBe(true);
    expect(BusinessValidation.isValidTaxRate(51)).toBe(false);
  });
});

describe('validateForm', () => {
  const schema = z.object({ name: z.string().min(2) });
  it('returns success with parsed data when valid', () => {
    const r = validateForm(schema, { name: 'Ravi' });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ name: 'Ravi' });
  });
  it('returns field errors when invalid', () => {
    const r = validateForm(schema, { name: 'R' });
    expect(r.success).toBe(false);
    expect(r.errors).toHaveProperty('name');
  });
});
