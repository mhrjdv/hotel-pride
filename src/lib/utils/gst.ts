/**
 * GST Calculation Utilities for Indian Hotel Tax Compliance
 * 
 * Hotel services in India are subject to 12% GST as per current tax regulations.
 * This utility provides functions to calculate GST for both inclusive and exclusive pricing.
 */

const GST_RATE = 0.12; // 12% GST for hotel services in India

export type GSTMode = 'inclusive' | 'exclusive' | 'none';

export interface GSTCalculation {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  gstMode: GSTMode;
}

export interface ExtraBed {
  quantity: number;
  ratePerBed: number;
  totalAmount: number;
}

export interface BookingCalculation extends GSTCalculation {
  roomCharges: {
    baseRate: number;
    customRate?: number;
    nights: number;
    totalRoomAmount: number;
  };
  extraBeds?: ExtraBed;
  additionalCharges?: { description: string; amount: number }[];
  breakdown: {
    roomTotal: number;
    extraBedTotal: number;
    additionalTotal: number;
    subtotal: number;
    gstAmount: number;
    grandTotal: number;
  };
}

/**
 * Calculate GST for a given amount with support for no GST option
 * @param baseAmount - The base amount (excluding GST for exclusive, including GST for inclusive)
 * @param gstMode - GST calculation mode: 'inclusive', 'exclusive', or 'none'
 * @returns GST calculation breakdown
 */
export function calculateGST(baseAmount: number, gstMode: GSTMode = 'inclusive'): GSTCalculation {
  if (gstMode === 'none') {
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      gstAmount: 0,
      totalAmount: Math.round(baseAmount * 100) / 100,
      gstMode
    };
  }

  if (gstMode === 'inclusive') {
    // When GST is inclusive, we need to extract the GST amount from the total
    const gstAmount = (baseAmount * GST_RATE) / (1 + GST_RATE);
    const actualBaseAmount = baseAmount - gstAmount;
    
    return {
      baseAmount: Math.round(actualBaseAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(baseAmount * 100) / 100,
      gstMode
    };
  } else {
    // When GST is exclusive, we add GST to the base amount
    const gstAmount = baseAmount * GST_RATE;
    const totalAmount = baseAmount + gstAmount;
    
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      gstMode
    };
  }
}

/**
 * Calculate comprehensive booking amount with room charges, extra beds, and additional services
 * @param params - Booking calculation parameters
 * @returns Complete booking calculation with detailed breakdown
 */
export function calculateBookingAmount(params: {
  baseRoomRate: number;
  customRoomRate?: number;
  nights: number;
  extraBeds?: { quantity: number; ratePerBed: number };
  additionalCharges?: { description: string; amount: number }[];
  gstMode?: GSTMode;
}): BookingCalculation {
  const {
    baseRoomRate,
    customRoomRate,
    nights,
    extraBeds,
    additionalCharges = [],
    gstMode = 'inclusive'
  } = params;

  // Use custom rate if provided, otherwise use base rate
  const effectiveRoomRate = customRoomRate ?? baseRoomRate;
  const totalRoomAmount = effectiveRoomRate * nights;

  // Calculate extra bed charges
  let extraBedTotal = 0;
  let extraBedDetails: ExtraBed | undefined;
  if (extraBeds && extraBeds.quantity > 0) {
    extraBedTotal = extraBeds.quantity * extraBeds.ratePerBed * nights;
    extraBedDetails = {
      quantity: extraBeds.quantity,
      ratePerBed: extraBeds.ratePerBed,
      totalAmount: extraBedTotal
    };
  }

  // Calculate additional charges
  const additionalTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);

  // Calculate subtotal (before GST)
  const subtotal = totalRoomAmount + extraBedTotal + additionalTotal;

  // Apply GST calculation
  const gstCalculation = calculateGST(subtotal, gstMode);

  return {
    baseAmount: gstCalculation.baseAmount,
    gstAmount: gstCalculation.gstAmount,
    totalAmount: gstCalculation.totalAmount,
    gstMode,
    roomCharges: {
      baseRate: baseRoomRate,
      customRate: customRoomRate,
      nights,
      totalRoomAmount
    },
    extraBeds: extraBedDetails,
    additionalCharges,
    breakdown: {
      roomTotal: totalRoomAmount,
      extraBedTotal,
      additionalTotal,
      subtotal,
      gstAmount: gstCalculation.gstAmount,
      grandTotal: gstCalculation.totalAmount
    }
  };
}

/**
 * Calculate booking amount with GST for hotel stays (legacy function for backward compatibility)
 * @param roomRate - Rate per night
 * @param nights - Number of nights
 * @param isGstInclusive - Whether the room rate includes GST
 * @returns Complete booking calculation with GST breakdown
 */
export function calculateBookingAmountLegacy(
  roomRate: number, 
  nights: number, 
  isGstInclusive: boolean = true
): GSTCalculation {
  const totalRoomCharges = roomRate * nights;
  return calculateGST(totalRoomCharges, isGstInclusive ? 'inclusive' : 'exclusive');
}

/**
 * Calculate additional charges with GST (food, services, etc.)
 * @param charges - Array of additional charges
 * @param gstMode - GST calculation mode
 * @returns GST calculation for additional charges
 */
export function calculateAdditionalCharges(
  charges: { description: string; amount: number }[],
  gstMode: GSTMode = 'inclusive'
): GSTCalculation & { chargeBreakdown: { description: string; amount: number; gst: number; total: number }[] } {
  const chargeBreakdown = charges.map(charge => {
    const gstCalc = calculateGST(charge.amount, gstMode);
    return {
      description: charge.description,
      amount: gstCalc.baseAmount,
      gst: gstCalc.gstAmount,
      total: gstCalc.totalAmount
    };
  });

  const totalBase = chargeBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const totalGst = chargeBreakdown.reduce((sum, item) => sum + item.gst, 0);
  const totalAmount = chargeBreakdown.reduce((sum, item) => sum + item.total, 0);

  return {
    baseAmount: Math.round(totalBase * 100) / 100,
    gstAmount: Math.round(totalGst * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    gstMode,
    chargeBreakdown
  };
}

/**
 * Format GST calculation for display with support for no GST mode
 * @param calculation - GST calculation result
 * @param currency - Currency symbol (default: ₹)
 * @returns Formatted GST breakdown
 */
export function formatGSTCalculation(
  calculation: GSTCalculation, 
  currency: string = '₹'
): {
  baseAmount: string;
  gstAmount: string;
  totalAmount: string;
  gstPercentage: string;
  showGST: boolean;
} {
  const showGST = calculation.gstMode !== 'none';
  
  return {
    baseAmount: `${currency}${calculation.baseAmount.toLocaleString('en-IN')}`,
    gstAmount: `${currency}${calculation.gstAmount.toLocaleString('en-IN')}`,
    totalAmount: `${currency}${calculation.totalAmount.toLocaleString('en-IN')}`,
    gstPercentage: showGST ? `${(GST_RATE * 100).toFixed(0)}%` : '0%',
    showGST
  };
}

/**
 * Format booking calculation for display
 * @param calculation - Booking calculation result
 * @param currency - Currency symbol (default: ₹)
 * @returns Formatted booking breakdown
 */
export function formatBookingCalculation(
  calculation: BookingCalculation,
  currency: string = '₹'
): {
  roomCharges: string;
  extraBedCharges?: string;
  additionalCharges?: string;
  subtotal: string;
  gstAmount: string;
  grandTotal: string;
  showGST: boolean;
  gstMode: GSTMode;
} {
  const showGST = calculation.gstMode !== 'none';
  
  return {
    roomCharges: `${currency}${calculation.breakdown.roomTotal.toLocaleString('en-IN')}`,
    extraBedCharges: calculation.breakdown.extraBedTotal > 0 
      ? `${currency}${calculation.breakdown.extraBedTotal.toLocaleString('en-IN')}` 
      : undefined,
    additionalCharges: calculation.breakdown.additionalTotal > 0 
      ? `${currency}${calculation.breakdown.additionalTotal.toLocaleString('en-IN')}` 
      : undefined,
    subtotal: `${currency}${calculation.breakdown.subtotal.toLocaleString('en-IN')}`,
    gstAmount: `${currency}${calculation.breakdown.gstAmount.toLocaleString('en-IN')}`,
    grandTotal: `${currency}${calculation.breakdown.grandTotal.toLocaleString('en-IN')}`,
    showGST,
    gstMode: calculation.gstMode
  };
}

/**
 * Validate GST calculation (for testing/verification)
 * @param calculation - GST calculation to validate
 * @param tolerance - Tolerance for floating point comparison (default: 0.01)
 * @returns Whether the calculation is valid
 */
export function validateGSTCalculation(
  calculation: GSTCalculation, 
  tolerance: number = 0.01
): boolean {
  const expectedTotal = calculation.baseAmount + calculation.gstAmount;
  const difference = Math.abs(expectedTotal - calculation.totalAmount);
  return difference <= tolerance;
}

/**
 * Get GST rate information
 * @returns Current GST rate and related information
 */
export function getGSTInfo() {
  return {
    rate: GST_RATE,
    percentage: `${(GST_RATE * 100).toFixed(0)}%`,
    applicableFor: 'Hotel services in India',
    lastUpdated: '2024-01-01', // Update this when GST rates change
    note: 'GST rates may vary based on government regulations. Please verify current rates.',
    modes: {
      inclusive: 'GST is included in the displayed price',
      exclusive: 'GST will be added to the displayed price',
      none: 'No GST will be applied to this booking'
    }
  };
} 