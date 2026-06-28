/**
 * Display-only helpers for rendering Indian GST tax invoices.
 *
 * NOTE: HSN/SAC codes are NOT stored in the database. They are derived here
 * from the line item type / description so the invoice document can present
 * like a proper Indian tax invoice without an API/DB change. If HSN/SAC ever
 * needs to be editable + persisted, add a column to invoice_line_items and a
 * field to InvoiceLineItemFormData (out of scope for this change).
 */

export interface SacLineItem {
  item_type?: string | null;
  custom_item_type_id?: string | null;
  description?: string | null;
  // Optional custom-type name to help classify when item_type === 'custom'.
  custom_item_type_name?: string | null;
}

/**
 * Map a line item to its Indian SAC (Services Accounting Code).
 *  - Accommodation: 996311
 *  - Restaurant / F&B / buffet: 996332
 *  - Transport: 9964
 *  - Laundry: 9997
 *  - Other services: 9997 (generic)
 */
export function getHsnSac(item: SacLineItem): string {
  const haystack = `${item.custom_item_type_name || ''} ${item.description || ''}`.toLowerCase();

  // Classify by basic item type first
  switch (item.item_type) {
    case 'room':
      return '996311';
    case 'food':
      return '996332';
    case 'discount':
      return '-';
  }

  // Keyword classification (covers custom item types and 'service'/'extra'/'other')
  if (/\b(room|accommodation|lodging|tariff|stay|night)\b/.test(haystack)) return '996311';
  if (/\b(food|beverage|buffet|breakfast|lunch|dinner|restaurant|meal|f&b)\b/.test(haystack)) return '996332';
  if (/\b(transport|cab|taxi|car|pickup|drop|airport)\b/.test(haystack)) return '9964';
  if (/\b(laundry|dry clean|washing)\b/.test(haystack)) return '9997';

  // Generic "other services" SAC
  return '9997';
}

/**
 * Suggest a GST rate for a room tariff per the Indian hotel slabs:
 *  - tariff per night <= 7500  -> 12%
 *  - tariff per night  > 7500  -> 18%
 */
export function suggestRoomGstRate(tariffPerNight: number): number {
  return tariffPerNight > 7500 ? 18 : 12;
}

/**
 * Split a total GST amount / rate into equal CGST + SGST halves
 * (intra-state supply, which is the common case for a hotel).
 */
export function splitGst(taxAmount: number, taxRate: number) {
  return {
    cgstRate: Math.round((taxRate / 2) * 100) / 100,
    sgstRate: Math.round((taxRate / 2) * 100) / 100,
    cgstAmount: Math.round((taxAmount / 2) * 100) / 100,
    sgstAmount: Math.round((taxAmount / 2) * 100) / 100,
  };
}
