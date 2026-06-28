'use client';

import { useMemo } from 'react';
import { InvoiceFormData, HotelConfig } from '@/lib/types/invoice';
import { calculateInvoiceTotal, formatCurrency, numberToWords, calculateGSTBreakdown } from '@/lib/utils/invoice-calculations';
import { getHsnSac, splitGst } from './invoice-display-helpers';

interface InvoiceLivePreviewProps {
  formData: InvoiceFormData;
  hotelConfig?: HotelConfig;
  className?: string;
}

/**
 * On-screen, A4-proportioned invoice preview. Mirrors the canonical saved-invoice
 * layout (InvoiceView) and the downloadable PDF (pdf-generator) field-for-field:
 * GSTIN, HSN/SAC, CGST/SGST split, place of supply, amount in words, bank details.
 *
 * It sizes to its own content (no fixed-height inner scroll) so the host page
 * scrolls naturally and there is no stray scrollbar / empty gap.
 */
export default function InvoiceLivePreview({ formData, hotelConfig, className }: InvoiceLivePreviewProps) {
  const currency = formData.currency || 'INR';

  const calculations = useMemo(() => {
    return calculateInvoiceTotal(formData.line_items.map(item => ({
      ...item,
      tax_rate: item.gst_rate,
      tax_inclusive: item.gst_inclusive,
      tax_name: item.gst_name,
    })));
  }, [formData.line_items]);

  const gstBreakdown = useMemo(() => {
    return calculateGSTBreakdown(formData.line_items.map(item => ({
      ...item,
      tax_rate: item.gst_rate,
      tax_inclusive: item.gst_inclusive,
      tax_name: item.gst_name,
    })));
  }, [formData.line_items]);

  const totalTax = calculations.total_tax;
  const totalCgst = Math.round((totalTax / 2) * 100) / 100;
  const totalSgst = totalTax - totalCgst;
  const totalTaxable = useMemo(
    () =>
      calculations.line_items.reduce(
        (sum, c) => sum + ((c?.final_amount || 0) - (c?.tax_amount || 0)),
        0
      ),
    [calculations.line_items]
  );

  const totalInWords = useMemo(() => numberToWords(calculations.total_amount), [calculations.total_amount]);

  const getInvoiceTypeLabel = () => {
    switch (formData.invoice_type) {
      case 'proforma': return 'PROFORMA INVOICE';
      case 'estimate': return 'ESTIMATE';
      case 'quote': return 'QUOTATION';
      default: return 'TAX INVOICE';
    }
  };

  const placeOfSupply = formData.customer_state || hotelConfig?.state || formData.hotel_state || '—';
  const showBank = formData.show_bank_details && hotelConfig && (hotelConfig.bank_name || hotelConfig.bank_account_number);

  return (
    <div className={`bg-white text-gray-900 border rounded-lg shadow-sm overflow-hidden text-sm ${className ?? ''}`}>
      {/* Hotel header + invoice meta */}
      <div className="p-5 sm:p-6 border-b">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold break-words">
              {hotelConfig?.name || formData.hotel_name || 'Hotel Pride'}
            </h1>
            <div className="text-sm text-gray-600 mt-1 space-y-0.5 break-words">
              {(hotelConfig?.address || formData.hotel_address) && (
                <div>{hotelConfig?.address || formData.hotel_address}</div>
              )}
              <div>
                {[hotelConfig?.city || formData.hotel_city, hotelConfig?.state || formData.hotel_state, hotelConfig?.pincode || formData.hotel_pincode]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              {(hotelConfig?.phone || formData.hotel_phone) && <div>Phone: {hotelConfig?.phone || formData.hotel_phone}</div>}
              {(hotelConfig?.email || formData.hotel_email) && <div>Email: {hotelConfig?.email || formData.hotel_email}</div>}
              {(hotelConfig?.gst_number || formData.hotel_gst_number) && (
                <div className="font-medium text-gray-700">GSTIN: {hotelConfig?.gst_number || formData.hotel_gst_number}</div>
              )}
              {(hotelConfig?.state || formData.hotel_state) && <div>State: {hotelConfig?.state || formData.hotel_state}</div>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-block px-4 py-1.5 rounded bg-gray-900 text-white font-bold tracking-wide">
              {getInvoiceTypeLabel()}
            </div>
            <div className="mt-3 text-sm space-y-0.5">
              <div>
                <span className="text-gray-500">Invoice No: </span>
                <span className="font-semibold">{formData.invoice_number || 'Auto-generated'}</span>
              </div>
              <div>
                <span className="text-gray-500">Date: </span>
                {formData.invoice_date ? new Date(formData.invoice_date).toLocaleDateString('en-IN') : '—'}
              </div>
              {formData.due_date && (
                <div>
                  <span className="text-gray-500">Due: </span>
                  {new Date(formData.due_date).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bill-to + booking reference */}
      <div className="p-5 sm:p-6 border-b grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Bill To</div>
          {formData.customer_type === 'company' && formData.company_name && (
            <div className="font-medium break-words">{formData.company_name}</div>
          )}
          <div className="font-medium break-words">{formData.customer_name || 'Customer Name'}</div>
          {formData.customer_type === 'company' && formData.company_contact_person && (
            <div className="text-gray-600">Contact: {formData.company_contact_person}</div>
          )}
          {formData.customer_address && <div className="text-gray-600 break-words">{formData.customer_address}</div>}
          {(formData.customer_city || formData.customer_state || formData.customer_pincode) && (
            <div className="text-gray-600">
              {[formData.customer_city, formData.customer_state, formData.customer_pincode].filter(Boolean).join(', ')}
            </div>
          )}
          {formData.customer_phone && <div className="text-gray-600">Phone: {formData.customer_phone}</div>}
          {formData.customer_email && <div className="text-gray-600 break-words">Email: {formData.customer_email}</div>}
          {(formData.customer_gst_number || formData.company_gst_number) && (
            <div className="font-medium text-gray-700 mt-1">GSTIN: {formData.customer_gst_number || formData.company_gst_number}</div>
          )}
          <div className="text-gray-600 mt-1">
            <span className="text-gray-500">Place of Supply: </span>
            {placeOfSupply}
          </div>
        </div>

        {formData.booking_id && (
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Booking Reference</div>
            <div className="text-gray-600">Linked to booking. Room charges prefilled from the stay.</div>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="p-5 sm:p-6 border-b overflow-x-auto">
        {formData.line_items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items added yet</div>
        ) : (
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-left py-2 pr-2">#</th>
                <th className="text-left py-2 pr-2">Description</th>
                <th className="text-left py-2 px-2 whitespace-nowrap">HSN/SAC</th>
                <th className="text-center py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Rate</th>
                <th className="text-right py-2 px-2">Taxable</th>
                <th className="text-right py-2 px-2">CGST</th>
                <th className="text-right py-2 px-2">SGST</th>
                <th className="text-right py-2 pl-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.line_items.map((item, index) => {
                const calculation = calculations.line_items[index];
                const taxAmount = calculation?.tax_amount || 0;
                const taxableValue = (calculation?.final_amount || 0) - taxAmount;
                const { cgstRate, sgstRate, cgstAmount, sgstAmount } = splitGst(taxAmount, item.gst_rate || 0);
                return (
                  <tr key={index} className="border-b align-top">
                    <td className="py-3 pr-2">{index + 1}</td>
                    <td className="py-3 pr-2 max-w-xs">
                      <div className="font-medium break-words">{item.description || 'Item description'}</div>
                      {item.is_buffet_item && (
                        <div className="text-xs text-gray-500 break-words">
                          {item.buffet_type} • {item.persons_count} persons @ {formatCurrency(item.price_per_person, currency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">{getHsnSac({ item_type: item.item_type, description: item.description })}</td>
                    <td className="text-center py-3 px-2">{item.quantity}</td>
                    <td className="text-right py-3 px-2 whitespace-nowrap">{formatCurrency(item.unit_price, currency)}</td>
                    <td className="text-right py-3 px-2 whitespace-nowrap">{formatCurrency(taxableValue, currency)}</td>
                    <td className="text-right py-3 px-2 whitespace-nowrap">
                      {item.gst_rate > 0 ? (
                        <>
                          {formatCurrency(cgstAmount, currency)}
                          <div className="text-xs text-gray-500">{cgstRate}%</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="text-right py-3 px-2 whitespace-nowrap">
                      {item.gst_rate > 0 ? (
                        <>
                          {formatCurrency(sgstAmount, currency)}
                          <div className="text-xs text-gray-500">{sgstRate}%</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="text-right py-3 pl-2 font-medium whitespace-nowrap">{formatCurrency(calculation?.final_amount || 0, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Tax summary + totals + amount in words */}
      <div className="p-5 sm:p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {Object.keys(gstBreakdown).length > 0 && (
            <>
              <div className="text-xs font-semibold uppercase text-gray-500 mb-2">GST Summary</div>
              <table className="w-full tabular-nums">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="text-left py-1">Rate</th>
                    <th className="text-right py-1">Taxable</th>
                    <th className="text-right py-1">CGST</th>
                    <th className="text-right py-1">SGST</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gstBreakdown).map(([rate, breakdown]) => {
                    const { cgstAmount, sgstAmount } = splitGst(breakdown.tax_amount, parseFloat(rate));
                    return (
                      <tr key={rate} className="border-b">
                        <td className="py-1">{rate}%</td>
                        <td className="text-right py-1 whitespace-nowrap">{formatCurrency(breakdown.taxable_amount, currency)}</td>
                        <td className="text-right py-1 whitespace-nowrap">{formatCurrency(cgstAmount, currency)}</td>
                        <td className="text-right py-1 whitespace-nowrap">{formatCurrency(sgstAmount, currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="space-y-1.5 tabular-nums">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Taxable Value</span>
            <span className="whitespace-nowrap">{formatCurrency(totalTaxable, currency)}</span>
          </div>
          {calculations.total_discount > 0 && (
            <div className="flex justify-between gap-4 text-red-600">
              <span>Discount</span>
              <span className="whitespace-nowrap">-{formatCurrency(calculations.total_discount, currency)}</span>
            </div>
          )}
          {totalTax > 0 && (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">CGST</span>
                <span className="whitespace-nowrap">{formatCurrency(totalCgst, currency)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">SGST</span>
                <span className="whitespace-nowrap">{formatCurrency(totalSgst, currency)}</span>
              </div>
            </>
          )}
          <div className="border-t my-1" />
          <div className="flex justify-between gap-4 text-base font-bold">
            <span>Grand Total</span>
            <span className="whitespace-nowrap">{formatCurrency(calculations.total_amount, currency)}</span>
          </div>
        </div>

        <div className="md:col-span-2 rounded border bg-white p-3">
          <span className="font-medium">Amount in Words: </span>
          {totalInWords}
        </div>

        {showBank && (
          <div className="md:col-span-2">
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Bank Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 text-gray-600">
              {hotelConfig?.bank_name && <div>Bank: {hotelConfig.bank_name}</div>}
              {hotelConfig?.bank_account_number && <div>A/c: {hotelConfig.bank_account_number}</div>}
              {hotelConfig?.bank_account_holder_name && <div>Holder: {hotelConfig.bank_account_holder_name}</div>}
              {hotelConfig?.bank_ifsc_code && <div>IFSC: {hotelConfig.bank_ifsc_code}</div>}
              {hotelConfig?.bank_branch && <div>Branch: {hotelConfig.bank_branch}</div>}
            </div>
          </div>
        )}

        {formData.terms_and_conditions && (
          <div className="md:col-span-2">
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Terms &amp; Conditions</div>
            <div className="text-gray-600 whitespace-pre-wrap break-words">{formData.terms_and_conditions}</div>
          </div>
        )}
      </div>
    </div>
  );
}
