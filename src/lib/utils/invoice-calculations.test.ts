import { describe, expect, it } from 'vitest';
import {
  calculateLineItem,
  calculateInvoiceTotal,
  calculateGSTBreakdown,
  formatCurrency,
  numberToWords,
  validateLineItem,
  validateInvoice,
  generateInvoiceNumber,
  calculateDueDate,
  isInvoiceOverdue,
  calculatePaymentBalance,
} from './invoice-calculations';
import type { InvoiceLineItemFormData, InvoiceFormData } from '@/lib/types/invoice';

function lineItem(overrides: Partial<InvoiceLineItemFormData> = {}): InvoiceLineItemFormData {
  return {
    item_type: 'room',
    description: 'Room 101',
    quantity: 2,
    unit_price: 1000,
    gst_rate: 12,
    gst_inclusive: false,
    gst_name: 'GST',
    discount_rate: 0,
    is_buffet_item: false,
    persons_count: 0,
    price_per_person: 0,
    sort_order: 0,
    ...overrides,
  };
}

describe('calculateLineItem', () => {
  describe('tax exclusive', () => {
    it('adds GST on top of the line amount', () => {
      const r = calculateLineItem(lineItem({ quantity: 1, unit_price: 1000, gst_rate: 18 }));
      expect(r.tax_amount).toBe(180);
      expect(r.line_total).toBe(1180);
      expect(r.final_amount).toBe(1180);
    });

    it('applies discount before adding GST', () => {
      const r = calculateLineItem(lineItem({ discount_rate: 10 }));
      expect(r.discount_amount).toBe(200); // 10% of 2000
      expect(r.tax_amount).toBe(216); // 12% of 1800
      expect(r.line_total).toBe(2016);
      expect(r.final_amount).toBe(2016);
    });

    it('handles a decimal unit price with rounding to 2 places', () => {
      const r = calculateLineItem(lineItem({ quantity: 1, unit_price: 1000.5, gst_rate: 18 }));
      expect(r.tax_amount).toBe(180.09);
      expect(r.final_amount).toBe(1180.59);
    });
  });

  describe('tax inclusive', () => {
    it('extracts GST from the amount, leaving line total unchanged', () => {
      const r = calculateLineItem(lineItem({ quantity: 1, unit_price: 1120, gst_inclusive: true, gst_rate: 12 }));
      expect(r.tax_amount).toBe(120);
      expect(r.line_total).toBe(1120);
      expect(r.final_amount).toBe(1120);
    });

    it('subtracts discount from the payable amount and extracts GST from remainder', () => {
      const r = calculateLineItem(lineItem({ gst_inclusive: true, discount_rate: 10 }));
      expect(r.discount_amount).toBe(200);
      expect(r.tax_amount).toBe(192.86); // 1800 * 12/112
      expect(r.line_total).toBe(1800);
      expect(r.final_amount).toBe(1800);
    });
  });

  describe('GST rate matrix', () => {
    it.each([
      [0, 0],
      [5, 50],
      [12, 120],
      [18, 180],
      [28, 280],
    ])('rate %i%% on 1000 (exclusive) yields %i tax', (rate, expectedTax) => {
      const r = calculateLineItem(lineItem({ quantity: 1, unit_price: 1000, gst_rate: rate }));
      expect(r.tax_amount).toBe(expectedTax);
    });

    it('applies no tax when rate is 0', () => {
      const r = calculateLineItem(lineItem({ gst_rate: 0 }));
      expect(r.tax_amount).toBe(0);
      expect(r.final_amount).toBe(2000);
    });
  });

  describe('discount matrix', () => {
    it('no discount', () => {
      expect(calculateLineItem(lineItem({ discount_rate: 0 })).discount_amount).toBe(0);
    });
    it('100% discount zeroes the line', () => {
      const r = calculateLineItem(lineItem({ quantity: 1, unit_price: 1000, discount_rate: 100 }));
      expect(r.discount_amount).toBe(1000);
      expect(r.tax_amount).toBe(0);
      expect(r.final_amount).toBe(0);
    });
  });

  describe('quantity matrix', () => {
    it('quantity 0 yields zero everything', () => {
      const r = calculateLineItem(lineItem({ quantity: 0 }));
      expect(r.final_amount).toBe(0);
      expect(r.tax_amount).toBe(0);
    });
    it('quantity 1', () => {
      expect(calculateLineItem(lineItem({ quantity: 1, unit_price: 1000, gst_rate: 0 })).final_amount).toBe(1000);
    });
    it('quantity 10', () => {
      const r = calculateLineItem(lineItem({ quantity: 10, unit_price: 500, gst_rate: 28, discount_rate: 10 }));
      expect(r.discount_amount).toBe(500);
      expect(r.tax_amount).toBe(1260);
      expect(r.final_amount).toBe(5760);
    });
  });

  describe('unit price matrix', () => {
    it.each([0, 1, 500, 1000.5])('unit price %d with 0 GST passes through', (price) => {
      const r = calculateLineItem(lineItem({ quantity: 1, unit_price: price, gst_rate: 0 }));
      expect(r.final_amount).toBe(price);
    });
  });
});

describe('calculateInvoiceTotal', () => {
  it('returns zeros for an empty invoice', () => {
    const t = calculateInvoiceTotal([]);
    expect(t).toMatchObject({ subtotal: 0, total_tax: 0, total_discount: 0, total_amount: 0 });
    expect(t.line_items).toEqual([]);
  });

  it('totals multiple mixed-mode line items using final payable amounts', () => {
    const t = calculateInvoiceTotal([
      lineItem({ quantity: 1, unit_price: 1000, gst_rate: 12 }), // excl: tax 120, final 1120
      lineItem({ quantity: 1, unit_price: 500, gst_rate: 0, discount_rate: 10 }), // disc 50, final 450
    ]);
    expect(t.total_tax).toBe(120);
    expect(t.total_discount).toBe(50);
    expect(t.total_amount).toBe(1570);
    expect(t.subtotal).toBe(1570);
  });

  it('mixes inclusive and exclusive items', () => {
    const t = calculateInvoiceTotal([
      lineItem({ quantity: 1, unit_price: 1120, gst_rate: 12, gst_inclusive: true }), // final 1120, tax 120
      lineItem({ quantity: 1, unit_price: 1000, gst_rate: 18, gst_inclusive: false }), // final 1180, tax 180
    ]);
    expect(t.total_tax).toBe(300);
    expect(t.total_amount).toBe(2300);
  });

  it('exposes per-line calculations', () => {
    const t = calculateInvoiceTotal([lineItem({ quantity: 1, unit_price: 1000, gst_rate: 0 })]);
    expect(t.line_items).toHaveLength(1);
    expect(t.line_items[0].final_amount).toBe(1000);
  });
});

describe('calculateGSTBreakdown', () => {
  it('groups taxable and tax amounts by GST rate', () => {
    const b = calculateGSTBreakdown([
      lineItem({ quantity: 1, unit_price: 1000, gst_rate: 12 }),
      lineItem({ quantity: 1, unit_price: 2000, gst_rate: 12 }),
      lineItem({ quantity: 1, unit_price: 1000, gst_rate: 18 }),
    ]);
    expect(Object.keys(b).sort()).toEqual(['12', '18']);
    expect(b[12]).toEqual({ taxable_amount: 3000, tax_amount: 360 });
    expect(b[18]).toEqual({ taxable_amount: 1000, tax_amount: 180 });
  });

  it('excludes zero-rate items from the breakdown', () => {
    const b = calculateGSTBreakdown([lineItem({ gst_rate: 0 })]);
    expect(Object.keys(b)).toEqual([]);
  });

  it('computes taxable amount net of GST for inclusive items', () => {
    const b = calculateGSTBreakdown([
      lineItem({ quantity: 1, unit_price: 1120, gst_rate: 12, gst_inclusive: true }),
    ]);
    expect(b[12].taxable_amount).toBe(1000);
    expect(b[12].tax_amount).toBe(120);
  });

  it('computes taxable amount net of discount for exclusive items', () => {
    const b = calculateGSTBreakdown([
      lineItem({ quantity: 1, unit_price: 1000, gst_rate: 18, discount_rate: 10 }),
    ]);
    expect(b[18].taxable_amount).toBe(900);
    expect(b[18].tax_amount).toBe(162);
  });
});

describe('formatCurrency', () => {
  it('formats INR with the rupee symbol and 2 decimals', () => {
    const s = formatCurrency(1000, 'INR');
    expect(s).toContain('₹');
    expect(s).toContain('1,000.00');
  });

  it('uses Indian digit grouping for large amounts', () => {
    // 1,00,000.00 (lakh grouping)
    expect(formatCurrency(100000, 'INR')).toContain('1,00,000.00');
  });

  it('formats non-INR currencies with US grouping', () => {
    const s = formatCurrency(1000, 'USD');
    expect(s).toContain('1,000.00');
    expect(s).toContain('$');
  });
});

describe('numberToWords', () => {
  it.each([
    [0, 'Zero Rupees Only'],
    [1, 'One Rupees Only'],
    [10, 'Ten Rupees Only'],
    [99, 'Ninety Nine Rupees Only'],
    [100, 'One Hundred Rupees Only'],
    [999, 'Nine Hundred Ninety Nine Rupees Only'],
    [1000, 'One Thousand Rupees Only'],
  ])('converts %d to "%s"', (amount, words) => {
    expect(numberToWords(amount)).toBe(words);
  });

  it('handles lakh', () => {
    expect(numberToWords(100000)).toBe('One Lakh Rupees Only');
  });

  it('handles crore', () => {
    expect(numberToWords(10000000)).toBe('One Crore Rupees Only');
  });

  it('handles rupees and paise together', () => {
    expect(numberToWords(1234.56)).toBe('One Thousand Two Hundred Thirty Four Rupees and Fifty Six Paise Only');
  });

  // Regression: paise must never exceed 99; rounding should roll into rupees.
  it('rounds paise up into a whole rupee instead of producing 100 paise', () => {
    expect(numberToWords(0.999)).toBe('One Rupees Only');
  });

  it('rolls 99.995 up to 100 rupees, not "99 rupees and 100 paise"', () => {
    expect(numberToWords(99.995)).toBe('One Hundred Rupees Only');
  });
});

describe('validateLineItem', () => {
  it('accepts a valid line item', () => {
    expect(validateLineItem(lineItem())).toEqual([]);
  });
  it('flags missing description', () => {
    expect(validateLineItem(lineItem({ description: '   ' }))).toContain('Description is required');
  });
  it('flags non-positive quantity', () => {
    expect(validateLineItem(lineItem({ quantity: 0 }))).toContain('Quantity must be greater than 0');
  });
  it('flags negative unit price', () => {
    expect(validateLineItem(lineItem({ unit_price: -1 }))).toContain('Unit price cannot be negative');
  });
  it('flags out-of-range GST rate', () => {
    expect(validateLineItem(lineItem({ gst_rate: 101 }))).toContain('Tax rate must be between 0 and 100');
    expect(validateLineItem(lineItem({ gst_rate: -1 }))).toContain('Tax rate must be between 0 and 100');
  });
  it('flags out-of-range discount rate', () => {
    expect(validateLineItem(lineItem({ discount_rate: 150 }))).toContain('Discount rate must be between 0 and 100');
  });
});

describe('validateInvoice', () => {
  function invoice(overrides: Partial<InvoiceFormData> = {}): Partial<InvoiceFormData> {
    return {
      customer_name: 'Ravi Kumar',
      invoice_date: '2026-06-28',
      line_items: [lineItem()],
      ...overrides,
    };
  }
  it('accepts a valid invoice', () => {
    expect(validateInvoice(invoice())).toEqual([]);
  });
  it('flags missing customer name', () => {
    expect(validateInvoice(invoice({ customer_name: '' }))).toContain('Customer name is required');
  });
  it('flags missing invoice date', () => {
    expect(validateInvoice(invoice({ invoice_date: '' }))).toContain('Invoice date is required');
  });
  it('flags an empty line item list', () => {
    expect(validateInvoice(invoice({ line_items: [] }))).toContain('At least one line item is required');
  });
  it('prefixes line item errors with the line number', () => {
    const errs = validateInvoice(invoice({ line_items: [lineItem({ quantity: 0 })] }));
    expect(errs).toContain('Line item 1: Quantity must be greater than 0');
  });
});

describe('generateInvoiceNumber', () => {
  const year = new Date().getFullYear();
  it('starts at 0001 when there is no previous number', () => {
    expect(generateInvoiceNumber()).toBe(`INV-${year}-0001`);
  });
  it('increments and zero-pads the previous number', () => {
    expect(generateInvoiceNumber(`INV-${year}-0009`)).toBe(`INV-${year}-0010`);
  });
  it('resets to 0001 when the previous prefix does not match (e.g. new year)', () => {
    expect(generateInvoiceNumber('INV-1999-0042')).toBe(`INV-${year}-0001`);
  });
});

describe('calculateDueDate', () => {
  it('adds the default 30-day payment term', () => {
    expect(calculateDueDate('2026-01-01')).toBe('2026-01-31');
  });
  it('adds a custom payment term', () => {
    expect(calculateDueDate('2026-01-01', 15)).toBe('2026-01-16');
  });
});

describe('isInvoiceOverdue', () => {
  it('is never overdue when paid', () => {
    expect(isInvoiceOverdue('2000-01-01', 'paid')).toBe(false);
  });
  it('is overdue when unpaid and past due', () => {
    expect(isInvoiceOverdue('2000-01-01', 'unpaid')).toBe(true);
  });
  it('is not overdue when due date is in the future', () => {
    expect(isInvoiceOverdue('2999-01-01', 'unpaid')).toBe(false);
  });
});

describe('calculatePaymentBalance', () => {
  it('returns the remaining balance rounded to 2 places', () => {
    expect(calculatePaymentBalance(1000, 250.5)).toBe(749.5);
  });
  it('returns zero when fully paid', () => {
    expect(calculatePaymentBalance(1000, 1000)).toBe(0);
  });
  it('returns a negative balance when overpaid', () => {
    expect(calculatePaymentBalance(1000, 1200)).toBe(-200);
  });
});
