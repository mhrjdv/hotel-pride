import { describe, expect, it } from 'vitest';
import {
  calculateGST,
  calculateBookingAmount,
  calculateBookingAmountLegacy,
  calculateAdditionalCharges,
  formatGSTCalculation,
  formatBookingCalculation,
  validateGSTCalculation,
  getGSTInfo,
} from './gst';

// NOTE: The implementation uses a fixed 12% GST rate for hotel services and does
// NOT split GST into CGST/SGST. There is no CGST/SGST function in this module, so
// those splits cannot be tested here (no such API exists).

describe('calculateGST', () => {
  describe('mode: none', () => {
    it('applies no GST and passes the amount through as base and total', () => {
      const r = calculateGST(1000, 'none');
      expect(r.baseAmount).toBe(1000);
      expect(r.gstAmount).toBe(0);
      expect(r.totalAmount).toBe(1000);
      expect(r.gstMode).toBe('none');
    });

    it('handles zero amount', () => {
      const r = calculateGST(0, 'none');
      expect(r).toMatchObject({ baseAmount: 0, gstAmount: 0, totalAmount: 0 });
    });

    it('rounds decimals to 2 places', () => {
      const r = calculateGST(1000.005, 'none');
      expect(r.baseAmount).toBe(1000.01);
      expect(r.totalAmount).toBe(1000.01);
    });
  });

  describe('mode: inclusive', () => {
    it('extracts 12% GST from an inclusive amount', () => {
      const r = calculateGST(1120, 'inclusive');
      expect(r.baseAmount).toBe(1000);
      expect(r.gstAmount).toBe(120);
      expect(r.totalAmount).toBe(1120);
    });

    it('is the default mode', () => {
      expect(calculateGST(1120)).toEqual(calculateGST(1120, 'inclusive'));
    });

    it('handles zero', () => {
      const r = calculateGST(0, 'inclusive');
      expect(r).toMatchObject({ baseAmount: 0, gstAmount: 0, totalAmount: 0 });
    });

    it('rounds decimal results to 2 places and remains internally consistent', () => {
      const r = calculateGST(999.99, 'inclusive');
      // gst = 999.99 * 0.12 / 1.12 = 107.1417...
      expect(r.gstAmount).toBe(107.14);
      expect(r.baseAmount).toBe(892.85);
      expect(r.totalAmount).toBe(999.99);
      expect(validateGSTCalculation(r)).toBe(true);
    });

    it('handles large amounts', () => {
      const r = calculateGST(11200000, 'inclusive');
      expect(r.baseAmount).toBe(10000000);
      expect(r.gstAmount).toBe(1200000);
      expect(r.totalAmount).toBe(11200000);
    });
  });

  describe('mode: exclusive', () => {
    it('adds 12% GST to the base amount', () => {
      const r = calculateGST(1000, 'exclusive');
      expect(r.baseAmount).toBe(1000);
      expect(r.gstAmount).toBe(120);
      expect(r.totalAmount).toBe(1120);
    });

    it('handles zero', () => {
      const r = calculateGST(0, 'exclusive');
      expect(r).toMatchObject({ baseAmount: 0, gstAmount: 0, totalAmount: 0 });
    });

    it('rounds decimals and stays consistent', () => {
      const r = calculateGST(1000.5, 'exclusive');
      expect(r.baseAmount).toBe(1000.5);
      expect(r.gstAmount).toBe(120.06);
      expect(r.totalAmount).toBe(1120.56);
      expect(validateGSTCalculation(r)).toBe(true);
    });

    it('handles large amounts', () => {
      const r = calculateGST(10000000, 'exclusive');
      expect(r.gstAmount).toBe(1200000);
      expect(r.totalAmount).toBe(11200000);
    });
  });
});

describe('validateGSTCalculation', () => {
  it('returns true when base + gst equals total within tolerance', () => {
    expect(validateGSTCalculation(calculateGST(1120, 'inclusive'))).toBe(true);
    expect(validateGSTCalculation(calculateGST(1000, 'exclusive'))).toBe(true);
  });

  it('returns false when amounts are inconsistent beyond tolerance', () => {
    expect(
      validateGSTCalculation({ baseAmount: 1000, gstAmount: 120, totalAmount: 2000, gstMode: 'exclusive' })
    ).toBe(false);
  });
});

describe('calculateBookingAmount', () => {
  it('uses base rate when no custom rate provided', () => {
    const r = calculateBookingAmount({ baseRoomRate: 1000, nights: 2, gstMode: 'none' });
    expect(r.roomCharges.baseRate).toBe(1000);
    expect(r.roomCharges.customRate).toBeUndefined();
    expect(r.breakdown.roomTotal).toBe(2000);
  });

  it('uses custom rate over base rate', () => {
    const r = calculateBookingAmount({ baseRoomRate: 1000, customRoomRate: 1500, nights: 2, gstMode: 'none' });
    expect(r.roomCharges.customRate).toBe(1500);
    expect(r.breakdown.roomTotal).toBe(3000);
  });

  describe('nights', () => {
    it('handles 0 nights (no room charge)', () => {
      const r = calculateBookingAmount({ baseRoomRate: 1000, nights: 0, gstMode: 'none' });
      expect(r.breakdown.roomTotal).toBe(0);
      expect(r.breakdown.subtotal).toBe(0);
    });
    it('handles 1 night', () => {
      const r = calculateBookingAmount({ baseRoomRate: 1000, nights: 1, gstMode: 'none' });
      expect(r.breakdown.roomTotal).toBe(1000);
    });
    it('handles 2 nights', () => {
      const r = calculateBookingAmount({ baseRoomRate: 1000, nights: 2, gstMode: 'none' });
      expect(r.breakdown.roomTotal).toBe(2000);
    });
    it('handles 30 nights', () => {
      const r = calculateBookingAmount({ baseRoomRate: 1000, nights: 30, gstMode: 'none' });
      expect(r.breakdown.roomTotal).toBe(30000);
    });
  });

  describe('extra beds', () => {
    it('omits extra bed details when quantity is 0', () => {
      const r = calculateBookingAmount({
        baseRoomRate: 1000, nights: 2, extraBeds: { quantity: 0, ratePerBed: 250 }, gstMode: 'none',
      });
      expect(r.extraBeds).toBeUndefined();
      expect(r.breakdown.extraBedTotal).toBe(0);
    });
    it('charges one extra bed per night', () => {
      const r = calculateBookingAmount({
        baseRoomRate: 1000, nights: 2, extraBeds: { quantity: 1, ratePerBed: 250 }, gstMode: 'none',
      });
      expect(r.extraBeds).toEqual({ quantity: 1, ratePerBed: 250, totalAmount: 500 });
      expect(r.breakdown.extraBedTotal).toBe(500);
    });
    it('charges many extra beds per night', () => {
      const r = calculateBookingAmount({
        baseRoomRate: 1000, nights: 3, extraBeds: { quantity: 4, ratePerBed: 250 }, gstMode: 'none',
      });
      expect(r.breakdown.extraBedTotal).toBe(3000); // 4 * 250 * 3
    });
  });

  describe('additional charges', () => {
    it('handles empty additional charges (default)', () => {
      const r = calculateBookingAmount({ baseRoomRate: 1000, nights: 1, gstMode: 'none' });
      expect(r.breakdown.additionalTotal).toBe(0);
      expect(r.additionalCharges).toEqual([]);
    });
    it('handles a single additional charge', () => {
      const r = calculateBookingAmount({
        baseRoomRate: 1000, nights: 1, additionalCharges: [{ description: 'Laundry', amount: 200 }], gstMode: 'none',
      });
      expect(r.breakdown.additionalTotal).toBe(200);
    });
    it('sums many additional charges', () => {
      const r = calculateBookingAmount({
        baseRoomRate: 1000, nights: 1,
        additionalCharges: [
          { description: 'Laundry', amount: 200 },
          { description: 'Food', amount: 350 },
          { description: 'Spa', amount: 1000 },
        ],
        gstMode: 'none',
      });
      expect(r.breakdown.additionalTotal).toBe(1550);
    });
  });

  it('computes exclusive GST over the full subtotal', () => {
    const r = calculateBookingAmount({
      baseRoomRate: 1000, nights: 2, extraBeds: { quantity: 1, ratePerBed: 250 }, gstMode: 'exclusive',
    });
    expect(r.breakdown.subtotal).toBe(2500);
    expect(r.gstAmount).toBe(300);
    expect(r.totalAmount).toBe(2800);
    expect(r.breakdown.grandTotal).toBe(2800);
  });

  it('computes inclusive GST extracted from the subtotal', () => {
    const r = calculateBookingAmount({ baseRoomRate: 1120, nights: 1, gstMode: 'inclusive' });
    expect(r.breakdown.subtotal).toBe(1120);
    expect(r.gstAmount).toBe(120);
    expect(r.baseAmount).toBe(1000);
    expect(r.totalAmount).toBe(1120);
  });

  it('defaults to inclusive GST mode', () => {
    const r = calculateBookingAmount({ baseRoomRate: 1120, nights: 1 });
    expect(r.gstMode).toBe('inclusive');
    expect(r.gstAmount).toBe(120);
  });
});

describe('calculateBookingAmountLegacy', () => {
  it('treats inclusive=true as inclusive mode', () => {
    const r = calculateBookingAmountLegacy(1120, 1, true);
    expect(r.gstMode).toBe('inclusive');
    expect(r.baseAmount).toBe(1000);
    expect(r.gstAmount).toBe(120);
  });

  it('treats inclusive=false as exclusive mode', () => {
    const r = calculateBookingAmountLegacy(1000, 2, false);
    expect(r.gstMode).toBe('exclusive');
    expect(r.baseAmount).toBe(2000);
    expect(r.gstAmount).toBe(240);
    expect(r.totalAmount).toBe(2240);
  });

  it('defaults to inclusive', () => {
    expect(calculateBookingAmountLegacy(1120, 1).gstMode).toBe('inclusive');
  });
});

describe('calculateAdditionalCharges', () => {
  it('handles an empty list', () => {
    const r = calculateAdditionalCharges([], 'exclusive');
    expect(r.baseAmount).toBe(0);
    expect(r.gstAmount).toBe(0);
    expect(r.totalAmount).toBe(0);
    expect(r.chargeBreakdown).toEqual([]);
  });

  it('computes per-charge exclusive GST and totals', () => {
    const r = calculateAdditionalCharges(
      [{ description: 'Food', amount: 1000 }, { description: 'Laundry', amount: 500 }],
      'exclusive'
    );
    expect(r.chargeBreakdown).toHaveLength(2);
    expect(r.chargeBreakdown[0]).toMatchObject({ description: 'Food', amount: 1000, gst: 120, total: 1120 });
    expect(r.baseAmount).toBe(1500);
    expect(r.gstAmount).toBe(180);
    expect(r.totalAmount).toBe(1680);
  });

  it('computes inclusive GST per charge', () => {
    const r = calculateAdditionalCharges([{ description: 'Food', amount: 1120 }], 'inclusive');
    expect(r.chargeBreakdown[0]).toMatchObject({ amount: 1000, gst: 120, total: 1120 });
  });
});

describe('formatGSTCalculation', () => {
  it('formats amounts with the default rupee symbol and shows GST', () => {
    const f = formatGSTCalculation(calculateGST(1120, 'inclusive'));
    expect(f.showGST).toBe(true);
    expect(f.gstPercentage).toBe('12%');
    expect(f.totalAmount).toContain('₹');
  });

  it('hides GST and shows 0% for none mode', () => {
    const f = formatGSTCalculation(calculateGST(1000, 'none'));
    expect(f.showGST).toBe(false);
    expect(f.gstPercentage).toBe('0%');
  });

  it('respects a custom currency symbol', () => {
    const f = formatGSTCalculation(calculateGST(1000, 'exclusive'), '$');
    expect(f.totalAmount.startsWith('$')).toBe(true);
  });
});

describe('formatBookingCalculation', () => {
  it('omits extra bed and additional charge strings when zero', () => {
    const calc = calculateBookingAmount({ baseRoomRate: 1000, nights: 1, gstMode: 'none' });
    const f = formatBookingCalculation(calc);
    expect(f.extraBedCharges).toBeUndefined();
    expect(f.additionalCharges).toBeUndefined();
    expect(f.showGST).toBe(false);
  });

  it('includes extra bed and additional charge strings when present', () => {
    const calc = calculateBookingAmount({
      baseRoomRate: 1000, nights: 1,
      extraBeds: { quantity: 1, ratePerBed: 250 },
      additionalCharges: [{ description: 'Food', amount: 200 }],
      gstMode: 'exclusive',
    });
    const f = formatBookingCalculation(calc);
    expect(f.extraBedCharges).toContain('₹');
    expect(f.additionalCharges).toContain('₹');
    expect(f.showGST).toBe(true);
    expect(f.gstMode).toBe('exclusive');
  });
});

describe('getGSTInfo', () => {
  it('reports the 12% hotel GST rate and modes', () => {
    const info = getGSTInfo();
    expect(info.rate).toBe(0.12);
    expect(info.percentage).toBe('12%');
    expect(info.modes).toHaveProperty('inclusive');
    expect(info.modes).toHaveProperty('exclusive');
    expect(info.modes).toHaveProperty('none');
  });
});
