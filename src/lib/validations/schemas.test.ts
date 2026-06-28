import { describe, expect, it } from 'vitest';
import {
  phoneSchema,
  pinCodeSchema,
  aadhaarSchema,
  panSchema,
  customerSchema,
  roomSchema,
  bookingSchema,
  paymentSchema,
  searchSchema,
  dateRangeSchema,
} from './schemas';

// Helpers to build dates relative to "now" so refinements behave deterministically.
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
const TODAY = new Date().toISOString().split('T')[0];

describe('phoneSchema', () => {
  it('accepts a valid +91 mobile number', () => {
    expect(phoneSchema.safeParse('+919876543210').success).toBe(true);
  });
  it('rejects numbers without the +91 prefix', () => {
    expect(phoneSchema.safeParse('9876543210').success).toBe(false);
  });
  it('rejects numbers starting below 6 (invalid Indian mobile)', () => {
    expect(phoneSchema.safeParse('+915876543210').success).toBe(false);
  });
  it('rejects numbers with the wrong length', () => {
    expect(phoneSchema.safeParse('+9198765432').success).toBe(false);
  });
});

describe('pinCodeSchema', () => {
  it('accepts a 6-digit PIN', () => {
    expect(pinCodeSchema.safeParse('400001').success).toBe(true);
  });
  it('rejects non-6-digit PINs', () => {
    expect(pinCodeSchema.safeParse('40001').success).toBe(false);
    expect(pinCodeSchema.safeParse('4000012').success).toBe(false);
    expect(pinCodeSchema.safeParse('40000a').success).toBe(false);
  });
});

describe('aadhaarSchema', () => {
  it('accepts 12 digits', () => {
    expect(aadhaarSchema.safeParse('123412341234').success).toBe(true);
  });
  it('rejects non-12-digit values', () => {
    expect(aadhaarSchema.safeParse('12341234123').success).toBe(false);
  });
});

describe('panSchema', () => {
  it('accepts a valid PAN', () => {
    expect(panSchema.safeParse('ABCDE1234F').success).toBe(true);
  });
  it('rejects malformed PANs', () => {
    expect(panSchema.safeParse('abcde1234f').success).toBe(false);
    expect(panSchema.safeParse('ABCD1234F').success).toBe(false);
  });
});

describe('customerSchema', () => {
  function customer(overrides: Record<string, unknown> = {}) {
    return {
      name: 'Ravi Kumar',
      phone: '+919876543210',
      idType: 'aadhaar',
      idNumber: '123412341234',
      ...overrides,
    };
  }

  it('accepts a valid customer with Aadhaar', () => {
    expect(customerSchema.safeParse(customer()).success).toBe(true);
  });

  it('requires a name of at least 2 characters', () => {
    expect(customerSchema.safeParse(customer({ name: 'R' })).success).toBe(false);
  });

  it('rejects names with digits or symbols', () => {
    expect(customerSchema.safeParse(customer({ name: 'Ravi123' })).success).toBe(false);
  });

  it('allows an omitted email', () => {
    expect(customerSchema.safeParse(customer()).success).toBe(true);
  });

  it('allows an empty-string email', () => {
    expect(customerSchema.safeParse(customer({ email: '' })).success).toBe(true);
  });

  it('accepts a valid email', () => {
    expect(customerSchema.safeParse(customer({ email: 'ravi@example.com' })).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(customerSchema.safeParse(customer({ email: 'not-an-email' })).success).toBe(false);
  });

  it('requires a valid Indian phone number', () => {
    expect(customerSchema.safeParse(customer({ phone: '9876543210' })).success).toBe(false);
  });

  describe('ID type / number cross-validation', () => {
    it('rejects an Aadhaar idType with a non-12-digit number', () => {
      const r = customerSchema.safeParse(customer({ idType: 'aadhaar', idNumber: '1234' }));
      expect(r.success).toBe(false);
    });
    it('accepts a valid PAN for a pan idType', () => {
      expect(customerSchema.safeParse(customer({ idType: 'pan', idNumber: 'ABCDE1234F' })).success).toBe(true);
    });
    it('rejects an invalid PAN for a pan idType', () => {
      expect(customerSchema.safeParse(customer({ idType: 'pan', idNumber: '123' })).success).toBe(false);
    });
    it('accepts a valid passport number', () => {
      expect(customerSchema.safeParse(customer({ idType: 'passport', idNumber: 'A1234567' })).success).toBe(true);
    });
    it('rejects an invalid passport number', () => {
      expect(customerSchema.safeParse(customer({ idType: 'passport', idNumber: 'AB123' })).success).toBe(false);
    });
    it('accepts driving_license / voter_id with any non-empty number', () => {
      expect(customerSchema.safeParse(customer({ idType: 'driving_license', idNumber: 'DL-01-2020' })).success).toBe(true);
      expect(customerSchema.safeParse(customer({ idType: 'voter_id', idNumber: 'XYZ1234567' })).success).toBe(true);
    });
    it('rejects an unknown idType', () => {
      expect(customerSchema.safeParse(customer({ idType: 'unknown' })).success).toBe(false);
    });
  });

  it('allows an empty-string pinCode but rejects a malformed one', () => {
    expect(customerSchema.safeParse(customer({ pinCode: '' })).success).toBe(true);
    expect(customerSchema.safeParse(customer({ pinCode: '12' })).success).toBe(false);
  });

  // The customer schema has no "blacklist" field; document that an extra/unknown
  // field is stripped rather than causing a validation failure.
  it('ignores an unrelated blacklist field (not part of the schema)', () => {
    const result = customerSchema.safeParse(customer({ blacklisted: true }));
    expect(result.success).toBe(true);
    expect(result.success && 'blacklisted' in result.data).toBe(false);
  });
});

describe('roomSchema', () => {
  function room(overrides: Record<string, unknown> = {}) {
    return {
      roomNumber: 'A101',
      roomType: 'vip',
      baseRate: 2000,
      currentRate: 2500,
      ...overrides,
    };
  }
  it('accepts a valid room', () => {
    expect(roomSchema.safeParse(room()).success).toBe(true);
  });
  it('rejects lowercase room numbers', () => {
    expect(roomSchema.safeParse(room({ roomNumber: 'a101' })).success).toBe(false);
  });
  it('rejects an unknown room type', () => {
    expect(roomSchema.safeParse(room({ roomType: 'suite' })).success).toBe(false);
  });
  it('enforces the minimum base rate of 500', () => {
    expect(roomSchema.safeParse(room({ baseRate: 400 })).success).toBe(false);
  });
  it('enforces the maximum rate of 50000', () => {
    expect(roomSchema.safeParse(room({ currentRate: 60000 })).success).toBe(false);
  });
  it('defaults amenities to an empty array', () => {
    const r = roomSchema.safeParse(room());
    expect(r.success && r.data.amenities).toEqual([]);
  });
});

describe('bookingSchema', () => {
  const ROOM_ID = '11111111-1111-1111-1111-111111111111';
  const CUST_ID = '22222222-2222-2222-2222-222222222222';
  function booking(overrides: Record<string, unknown> = {}) {
    return {
      roomId: ROOM_ID,
      primaryCustomerId: CUST_ID,
      checkInDate: TODAY,
      checkOutDate: daysFromNow(2),
      totalGuests: 2,
      roomRate: 1500,
      ...overrides,
    };
  }

  it('accepts a valid future booking', () => {
    expect(bookingSchema.safeParse(booking()).success).toBe(true);
  });

  it('allows same-day check-in (today is not "in the past")', () => {
    expect(bookingSchema.safeParse(booking({ checkInDate: TODAY })).success).toBe(true);
  });

  it('rejects a check-in date in the past', () => {
    expect(bookingSchema.safeParse(booking({ checkInDate: daysFromNow(-2) })).success).toBe(false);
  });

  it('rejects a check-out before check-in', () => {
    const r = bookingSchema.safeParse(booking({ checkInDate: daysFromNow(5), checkOutDate: daysFromNow(3) }));
    expect(r.success).toBe(false);
  });

  it('rejects a check-out that is not in the future', () => {
    expect(bookingSchema.safeParse(booking({ checkOutDate: daysFromNow(-1) })).success).toBe(false);
  });

  it('rejects an invalid room UUID', () => {
    expect(bookingSchema.safeParse(booking({ roomId: 'not-a-uuid' })).success).toBe(false);
  });

  it('requires at least 1 guest', () => {
    expect(bookingSchema.safeParse(booking({ totalGuests: 0 })).success).toBe(false);
  });

  it('enforces the minimum room rate of 500', () => {
    expect(bookingSchema.safeParse(booking({ roomRate: 100 })).success).toBe(false);
  });

  it('defaults isGstInclusive to true', () => {
    const r = bookingSchema.safeParse(booking());
    expect(r.success && r.data.isGstInclusive).toBe(true);
  });

  it('rejects special requests longer than 500 characters', () => {
    expect(bookingSchema.safeParse(booking({ specialRequests: 'x'.repeat(501) })).success).toBe(false);
  });
});

describe('paymentSchema', () => {
  const BOOKING_ID = '33333333-3333-3333-3333-333333333333';
  function payment(overrides: Record<string, unknown> = {}) {
    return { bookingId: BOOKING_ID, paymentMethod: 'cash', amount: 1000, ...overrides };
  }
  it('accepts a valid payment', () => {
    expect(paymentSchema.safeParse(payment()).success).toBe(true);
  });
  it('rejects an invalid payment method', () => {
    expect(paymentSchema.safeParse(payment({ paymentMethod: 'crypto' })).success).toBe(false);
  });
  it('rejects a non-positive amount', () => {
    expect(paymentSchema.safeParse(payment({ amount: 0 })).success).toBe(false);
  });
  it('rejects an amount over the 1,00,000 cap', () => {
    expect(paymentSchema.safeParse(payment({ amount: 100001 })).success).toBe(false);
  });
  it('accepts each supported payment method', () => {
    for (const m of ['cash', 'card', 'upi', 'bank_transfer']) {
      expect(paymentSchema.safeParse(payment({ paymentMethod: m })).success).toBe(true);
    }
  });
});

describe('searchSchema', () => {
  it('requires a non-empty query', () => {
    expect(searchSchema.safeParse({ query: '' }).success).toBe(false);
    expect(searchSchema.safeParse({ query: 'ravi' }).success).toBe(true);
  });
  it('rejects an unknown type', () => {
    expect(searchSchema.safeParse({ query: 'ravi', type: 'invoice' }).success).toBe(false);
  });
});

describe('dateRangeSchema', () => {
  it('accepts a valid range', () => {
    expect(dateRangeSchema.safeParse({ startDate: '2026-01-01', endDate: '2026-01-31' }).success).toBe(true);
  });
  it('rejects an end date before the start date', () => {
    expect(dateRangeSchema.safeParse({ startDate: '2026-02-01', endDate: '2026-01-01' }).success).toBe(false);
  });
  it('rejects invalid date strings', () => {
    expect(dateRangeSchema.safeParse({ startDate: 'nope', endDate: '2026-01-31' }).success).toBe(false);
  });
});
