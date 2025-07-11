import { InvoiceLineItemFormData, InvoiceCalculation, InvoiceLineItemCalculation, InvoiceFormData } from '@/lib/types/invoice';

/**
 * Calculate line item totals including tax and discount
 */
export function calculateLineItem(item: InvoiceLineItemFormData): InvoiceLineItemCalculation {
  const quantity = item.quantity || 0;
  const unitPrice = item.unit_price || 0;
  const taxRate = item.gst_rate || 0;
  const discountRate = item.discount_rate || 0;
  const taxInclusive = item.gst_inclusive || false;

  // Calculate base amount
  const baseAmount = quantity * unitPrice;

  let lineTotal = baseAmount;
  let taxAmount = 0;
  let discountAmount = 0;

  // Calculate discount first (always on base amount)
  if (discountRate > 0) {
    discountAmount = (baseAmount * discountRate) / 100;
  }

  // Calculate tax
  if (taxRate > 0) {
    if (taxInclusive) {
      // Tax is included in the unit price
      taxAmount = (baseAmount * taxRate) / (100 + taxRate);
      lineTotal = baseAmount; // Total remains the same
    } else {
      // Tax is added to the base amount
      const taxableAmount = baseAmount - discountAmount;
      taxAmount = (taxableAmount * taxRate) / 100;
      lineTotal = baseAmount + taxAmount - discountAmount;
    }
  } else {
    lineTotal = baseAmount - discountAmount;
  }

  const finalAmount = lineTotal;

  return {
    line_total: Math.round(lineTotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    final_amount: Math.round(finalAmount * 100) / 100,
  };
}

/**
 * Calculate total invoice amounts
 */
export function calculateInvoiceTotal(lineItems: InvoiceLineItemFormData[]): InvoiceCalculation {
  const calculations = lineItems.map(calculateLineItem);
  
  const subtotal = calculations.reduce((sum, calc) => sum + calc.line_total, 0);
  const totalTax = calculations.reduce((sum, calc) => sum + calc.tax_amount, 0);
  const totalDiscount = calculations.reduce((sum, calc) => sum + calc.discount_amount, 0);
  const totalAmount = calculations.reduce((sum, calc) => sum + calc.final_amount, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total_tax: Math.round(totalTax * 100) / 100,
    total_discount: Math.round(totalDiscount * 100) / 100,
    total_amount: Math.round(totalAmount * 100) / 100,
    line_items: calculations,
  };
}

/**
 * Calculate GST breakdown for Indian invoices
 */
export function calculateGSTBreakdown(lineItems: InvoiceLineItemFormData[]) {
  const gstBreakdown: Record<number, { taxable_amount: number; tax_amount: number }> = {};

  lineItems.forEach(item => {
    const calculation = calculateLineItem(item);
    const taxRate = item.gst_rate || 0;

    if (taxRate > 0) {
      if (!gstBreakdown[taxRate]) {
        gstBreakdown[taxRate] = { taxable_amount: 0, tax_amount: 0 };
      }

      const taxableAmount = item.gst_inclusive
        ? (item.quantity * item.unit_price) - calculation.tax_amount - calculation.discount_amount
        : (item.quantity * item.unit_price) - calculation.discount_amount;

      gstBreakdown[taxRate].taxable_amount += taxableAmount;
      gstBreakdown[taxRate].tax_amount += calculation.tax_amount;
    }
  });

  // Round values
  Object.keys(gstBreakdown).forEach(rate => {
    const rateNum = parseFloat(rate);
    gstBreakdown[rateNum].taxable_amount = Math.round(gstBreakdown[rateNum].taxable_amount * 100) / 100;
    gstBreakdown[rateNum].tax_amount = Math.round(gstBreakdown[rateNum].tax_amount * 100) / 100;
  });

  return gstBreakdown;
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert number to words (for Indian currency)
 */
export function numberToWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  // const scales = ['', 'Thousand', 'Lakh', 'Crore']; // Unused for now

  function convertHundreds(num: number): string {
    let result = '';

    if (num > 99) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }

    if (num > 19) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }

    if (num > 0) {
      result += ones[num] + ' ';
    }

    return result;
  }

  function convertToWords(num: number): string {
    if (num === 0) return 'Zero';

    let result = '';
    // let scaleIndex = 0; // Unused for now

    // Handle crores
    if (num >= 10000000) {
      const crores = Math.floor(num / 10000000);
      result += convertHundreds(crores) + 'Crore ';
      num %= 10000000;
    }

    // Handle lakhs
    if (num >= 100000) {
      const lakhs = Math.floor(num / 100000);
      result += convertHundreds(lakhs) + 'Lakh ';
      num %= 100000;
    }

    // Handle thousands
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      result += convertHundreds(thousands) + 'Thousand ';
      num %= 1000;
    }

    // Handle hundreds
    if (num > 0) {
      result += convertHundreds(num);
    }

    return result.trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = '';

  if (rupees > 0) {
    result += convertToWords(rupees) + ' Rupees';
  }

  if (paise > 0) {
    if (result) result += ' and ';
    result += convertToWords(paise) + ' Paise';
  }

  if (!result) {
    result = 'Zero Rupees';
  }

  return result + ' Only';
}

/**
 * Validate invoice line item
 */
export function validateLineItem(item: InvoiceLineItemFormData): string[] {
  const errors: string[] = [];

  if (!item.description || item.description.trim() === '') {
    errors.push('Description is required');
  }

  if (item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (item.unit_price < 0) {
    errors.push('Unit price cannot be negative');
  }

  if (item.gst_rate < 0 || item.gst_rate > 100) {
    errors.push('Tax rate must be between 0 and 100');
  }

  if (item.discount_rate < 0 || item.discount_rate > 100) {
    errors.push('Discount rate must be between 0 and 100');
  }

  return errors;
}

/**
 * Validate entire invoice
 */
export function validateInvoice(invoice: Partial<InvoiceFormData>): string[] {
  const errors: string[] = [];

  if (!invoice.customer_name || invoice.customer_name.trim() === '') {
    errors.push('Customer name is required');
  }

  if (!invoice.invoice_date) {
    errors.push('Invoice date is required');
  }

  if (!invoice.line_items || invoice.line_items.length === 0) {
    errors.push('At least one line item is required');
  }

  if (invoice.line_items) {
    invoice.line_items.forEach((item: InvoiceLineItemFormData, index: number) => {
      const itemErrors = validateLineItem(item);
      itemErrors.forEach(error => {
        errors.push(`Line item ${index + 1}: ${error}`);
      });
    });
  }

  return errors;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(lastInvoiceNumber?: string): string {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  if (!lastInvoiceNumber || !lastInvoiceNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const numberPart = lastInvoiceNumber.replace(prefix, '');
  const nextNumber = parseInt(numberPart, 10) + 1;
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Calculate due date based on payment terms
 */
export function calculateDueDate(invoiceDate: string, paymentTerms: number = 30): string {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + paymentTerms);
  return date.toISOString().split('T')[0];
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(dueDate: string, paymentStatus: string): boolean {
  if (paymentStatus === 'paid') return false;
  
  const today = new Date();
  const due = new Date(dueDate);
  
  return due < today;
}

/**
 * Calculate payment balance
 */
export function calculatePaymentBalance(totalAmount: number, paidAmount: number): number {
  return Math.round((totalAmount - paidAmount) * 100) / 100;
}
