'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InvoiceFormData, HotelConfig } from '@/lib/types/invoice';
import { calculateInvoiceTotal, formatCurrency, numberToWords, calculateGSTBreakdown } from '@/lib/utils/invoice-calculations';

interface InvoiceLivePreviewProps {
  formData: InvoiceFormData;
  hotelConfig?: HotelConfig;
  className?: string;
}

export default function InvoiceLivePreview({ formData, hotelConfig, className }: InvoiceLivePreviewProps) {
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

  const totalInWords = useMemo(() => {
    return numberToWords(calculations.total_amount);
  }, [calculations.total_amount]);

  const getInvoiceTypeLabel = () => {
    switch (formData.invoice_type) {
      case 'proforma': return 'PROFORMA INVOICE';
      case 'estimate': return 'ESTIMATE';
      case 'quote': return 'QUOTATION';
      default: return 'INVOICE';
    }
  };

  const getInvoiceTypeColor = () => {
    switch (formData.invoice_type) {
      case 'proforma': return 'bg-blue-600';
      case 'estimate': return 'bg-green-600';
      case 'quote': return 'bg-purple-600';
      default: return 'bg-gray-800';
    }
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Invoice Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-6">
          {/* Hotel Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {hotelConfig?.name || formData.hotel_name || 'Hotel Pride'}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <div>{hotelConfig?.address || formData.hotel_address}</div>
              <div>
                {hotelConfig?.city || formData.hotel_city}, {hotelConfig?.state || formData.hotel_state} {hotelConfig?.pincode || formData.hotel_pincode}
              </div>
              <div>{hotelConfig?.country || formData.hotel_country}</div>
              {(hotelConfig?.phone || formData.hotel_phone) && (
                <div>Phone: {hotelConfig?.phone || formData.hotel_phone}</div>
              )}
              {(hotelConfig?.email || formData.hotel_email) && (
                <div>Email: {hotelConfig?.email || formData.hotel_email}</div>
              )}
              {(hotelConfig?.gst_number || formData.hotel_gst_number) && (
                <div>GST No: {hotelConfig?.gst_number || formData.hotel_gst_number}</div>
              )}
            </div>
          </div>

          {/* Invoice Type & Number */}
          <div className="text-right">
            <div className={`inline-block px-4 py-2 rounded text-white font-bold text-lg mb-3 ${getInvoiceTypeColor()}`}>
              {getInvoiceTypeLabel()}
            </div>
            <div className="space-y-1 text-sm">
              <div><strong>Number:</strong> {formData.invoice_number || 'Auto-generated'}</div>
              <div><strong>Date:</strong> {formData.invoice_date ? new Date(formData.invoice_date).toLocaleDateString('en-IN') : 'Not set'}</div>
              {formData.due_date && (
                <div><strong>Due Date:</strong> {new Date(formData.due_date).toLocaleDateString('en-IN')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              Bill To
              <Badge variant="outline">
                {formData.customer_type === 'company' ? '🏢 Company' : '👤 Individual'}
              </Badge>
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              {formData.customer_type === 'company' && formData.company_name && (
                <div className="font-medium">{formData.company_name}</div>
              )}
              <div className="font-medium">{formData.customer_name || 'Customer Name'}</div>
              {formData.customer_type === 'company' && formData.company_contact_person && (
                <div>Contact: {formData.company_contact_person}</div>
              )}
              {formData.customer_address && <div>{formData.customer_address}</div>}
              {(formData.customer_city || formData.customer_state || formData.customer_pincode) && (
                <div>
                  {formData.customer_city && `${formData.customer_city}, `}
                  {formData.customer_state && `${formData.customer_state} `}
                  {formData.customer_pincode}
                </div>
              )}
              {formData.customer_phone && <div>Phone: {formData.customer_phone}</div>}
              {formData.customer_email && <div>Email: {formData.customer_email}</div>}
              {(formData.customer_gst_number || formData.company_gst_number) && (
                <div>GST No: {formData.customer_gst_number || formData.company_gst_number}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
        {formData.line_items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No items added yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Rate</th>
                  <th className="text-center py-2">GST%</th>
                  <th className="text-right py-2">GST</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {formData.line_items.map((item, index) => {
                  const calculation = calculations.line_items[index];
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-3">{index + 1}</td>
                      <td className="py-3">
                        <div className="font-medium">{item.description || 'Item description'}</div>
                        {item.is_buffet_item && (
                          <div className="text-xs text-gray-500">
                            {item.buffet_type} • {item.persons_count} persons @ {formatCurrency(item.price_per_person)}
                          </div>
                        )}
                      </td>
                      <td className="text-center py-3">{item.quantity}</td>
                      <td className="text-right py-3">{formatCurrency(item.unit_price)}</td>
                      <td className="text-center py-3">{item.gst_rate}%</td>
                      <td className="text-right py-3">{formatCurrency(calculation?.tax_amount || 0)}</td>
                      <td className="text-right py-3 font-medium">{formatCurrency(calculation?.final_amount || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals Section */}
      <div className="p-6 bg-gray-50 border-t">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GST Breakdown */}
          {Object.keys(gstBreakdown).length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">GST Breakdown</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">GST Rate</th>
                    <th className="text-right py-1">Taxable Amount</th>
                    <th className="text-right py-1">GST Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gstBreakdown).map(([rate, breakdown]) => (
                    <tr key={rate} className="border-b">
                      <td className="py-1">{rate}%</td>
                      <td className="text-right py-1">{formatCurrency(breakdown.taxable_amount)}</td>
                      <td className="text-right py-1">{formatCurrency(breakdown.tax_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Invoice Totals */}
          <div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculations.subtotal)}</span>
              </div>
              {calculations.total_discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(calculations.total_discount)}</span>
                </div>
              )}
              {calculations.total_tax > 0 && (
                <div className="flex justify-between">
                  <span>Total GST:</span>
                  <span>{formatCurrency(calculations.total_tax)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>{formatCurrency(calculations.total_amount)}</span>
              </div>
            </div>

            {/* Amount in Words */}
            {calculations.total_amount > 0 && (
              <div className="mt-4 p-3 bg-white border rounded text-xs">
                <div className="font-medium mb-1">Amount in Words:</div>
                <div>{totalInWords}</div>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        {formData.show_bank_details && hotelConfig && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Bank Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div><strong>Bank Name:</strong> {hotelConfig.bank_name || 'Not configured'}</div>
                <div><strong>Account Number:</strong> {hotelConfig.bank_account_number || 'Not configured'}</div>
                <div><strong>Account Holder:</strong> {hotelConfig.bank_account_holder_name || 'Not configured'}</div>
              </div>
              <div>
                <div><strong>IFSC Code:</strong> {hotelConfig.bank_ifsc_code || 'Not configured'}</div>
                <div><strong>Branch:</strong> {hotelConfig.bank_branch || 'Not configured'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        {formData.terms_and_conditions && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-2">Terms and Conditions</h4>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">
              {formData.terms_and_conditions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
