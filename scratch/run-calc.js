function calculateLineItem(item) {
  const quantity = item.quantity || 0;
  const unitPrice = item.unit_price || 0;
  const taxRate = item.gst_rate || 0;
  const discountRate = item.discount_rate || 0;
  const taxInclusive = item.gst_inclusive || false;

  const grossAmount = quantity * unitPrice;
  const discountAmount = discountRate > 0 ? (grossAmount * discountRate) / 100 : 0;
  const discountedAmount = grossAmount - discountAmount;

  let lineTotal = discountedAmount;
  let taxAmount = 0;

  // Calculate tax
  if (taxRate > 0) {
    if (taxInclusive) {
      taxAmount = (discountedAmount * taxRate) / (100 + taxRate);
      lineTotal = discountedAmount;
    } else {
      taxAmount = (discountedAmount * taxRate) / 100;
      lineTotal = discountedAmount + taxAmount;
    }
  }

  const finalAmount = lineTotal;

  return {
    line_total: Math.round(lineTotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    final_amount: Math.round(finalAmount * 100) / 100,
  };
}

function calculateInvoiceTotal(lineItems) {
  const calculations = lineItems.map(calculateLineItem);
  
  const subtotal = calculations.reduce((sum, calc) => sum + calc.final_amount, 0);
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

console.log(JSON.stringify(calculateInvoiceTotal([
  {
    quantity: 1,
    unit_price: 2500,
    gst_rate: 12,
    gst_inclusive: false
  }
]), null, 2));
