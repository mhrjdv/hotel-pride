/**
 * GST Calculation Utilities for Indian Hotel Operations
 * Standard hotel GST rate is 12% as per Indian tax regulations
 */

export const GST_RATE = 0.12; // 12% GST for hotel services

export interface GSTCalculation {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  gstRate: number;
}

/**
 * Calculate GST for hotel billing
 * @param amount - The amount to calculate GST for
 * @param isInclusive - Whether GST is included in the amount or needs to be added
 * @returns GSTCalculation object with breakdown
 */
export function calculateGST(amount: number, isInclusive: boolean = true): GSTCalculation {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  if (isInclusive) {
    // GST is included in the amount - extract it
    const gstAmount = (amount * GST_RATE) / (1 + GST_RATE);
    const baseAmount = amount - gstAmount;
    
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: amount,
      gstRate: GST_RATE
    };
  } else {
    // GST needs to be added to the amount
    const baseAmount = amount;
    const gstAmount = amount * GST_RATE;
    const totalAmount = baseAmount + gstAmount;
    
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      gstRate: GST_RATE
    };
  }
}

/**
 * Calculate total booking amount with GST for multiple nights
 * @param roomRate - Per night room rate
 * @param nights - Number of nights
 * @param isGSTInclusive - Whether the room rate includes GST
 * @returns Complete billing breakdown
 */
export function calculateBookingAmount(
  roomRate: number, 
  nights: number, 
  isGSTInclusive: boolean = true
): GSTCalculation & { totalNights: number; perNightRate: number } {
  if (nights <= 0) {
    throw new Error('Number of nights must be greater than zero');
  }

  const totalRoomAmount = roomRate * nights;
  const gstCalculation = calculateGST(totalRoomAmount, isGSTInclusive);
  
  return {
    ...gstCalculation,
    totalNights: nights,
    perNightRate: roomRate
  };
}

/**
 * Format currency in Indian Rupees
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Generate GST invoice breakdown text
 * @param calculation - GST calculation result
 * @returns Formatted invoice breakdown
 */
export function generateGSTBreakdown(calculation: GSTCalculation): string {
  return `
Room Charges: ${formatCurrency(calculation.baseAmount)}
GST (${(GST_RATE * 100).toFixed(0)}%): ${formatCurrency(calculation.gstAmount)}
Total Amount: ${formatCurrency(calculation.totalAmount)}
  `.trim();
} 