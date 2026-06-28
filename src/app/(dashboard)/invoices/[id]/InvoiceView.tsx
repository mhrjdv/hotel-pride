'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Download,
  Mail,
  Plus,
  CreditCard,
  FileText,
} from '@/components/icons';
import { toast } from 'sonner';
import { Invoice, INVOICE_STATUSES, PAYMENT_STATUSES } from '@/lib/types/invoice';
import { formatCurrency, numberToWords } from '@/lib/utils/invoice-calculations';
import { getHsnSac, splitGst } from '../components/invoice-display-helpers';
import PaymentDialog from './PaymentDialog';

interface InvoiceViewProps {
  invoiceId: string;
}

export default function InvoiceView({ invoiceId }: InvoiceViewProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [hotelConfig, setHotelConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const data = await response.json();

      if (data.success) {
        setInvoice(data.data);
      } else {
        toast.error('Failed to fetch invoice');
        router.push('/invoices');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to fetch invoice');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, router]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  useEffect(() => {
    // Bank details are configured on the hotel, not stored per-invoice, so fetch
    // them separately for the tax-invoice footer.
    fetch('/api/hotel/config')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.success) setHotelConfig(data.data);
      })
      .catch(() => {});
  }, []);

  const handleSendEmail = async () => {
    toast.info('Sending invoice email…');
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailData: { attach_pdf: true } }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.previewUrl) {
          toast.success('Invoice email sent (test inbox).', {
            description: 'No real SMTP set — click to view the email preview.',
            action: { label: 'View email', onClick: () => window.open(data.previewUrl, '_blank') },
            duration: 15000,
          });
        } else {
          toast.success('Invoice email sent.');
        }
      } else {
        toast.error(data.error || 'Failed to send email.');
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      toast.error('Failed to send email.');
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  const getStatusBadge = (status: string, type: 'invoice' | 'payment') => {
    const statuses = type === 'invoice' ? INVOICE_STATUSES : PAYMENT_STATUSES;
    const statusConfig = statuses.find(s => s.value === status);

    if (!statusConfig) return <Badge variant="secondary">{status}</Badge>;

    const variants: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
      gray: 'secondary',
      blue: 'default',
      green: 'default',
      red: 'destructive',
      yellow: 'secondary',
      orange: 'secondary',
      purple: 'secondary',
    };

    return (
      <Badge variant={variants[statusConfig.color] || 'secondary'}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Invoice not found</h3>
        <Button onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  // Type assertion for database invoice data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  const currency = invoiceData.currency || 'INR';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = invoiceData.line_items || [];

  // Aggregate CGST/SGST split across all taxed line items, grouped by rate,
  // for the GST summary on a proper Indian tax invoice.
  const gstByRate: Record<number, { taxable: number; cgst: number; sgst: number }> = {};
  let totalTaxable = 0;
  lineItems.forEach(item => {
    const rate = item.tax_rate || 0;
    const taxAmount = item.tax_amount || 0;
    const taxableValue = (item.line_total || 0) - taxAmount;
    totalTaxable += taxableValue;
    if (rate > 0) {
      if (!gstByRate[rate]) gstByRate[rate] = { taxable: 0, cgst: 0, sgst: 0 };
      const { cgstAmount, sgstAmount } = splitGst(taxAmount, rate);
      gstByRate[rate].taxable += taxableValue;
      gstByRate[rate].cgst += cgstAmount;
      gstByRate[rate].sgst += sgstAmount;
    }
  });

  const totalTax = invoiceData.total_tax || 0;
  const totalCgst = Math.round((totalTax / 2) * 100) / 100;
  const totalSgst = totalTax - totalCgst;

  const placeOfSupply = invoiceData.customer_state || invoiceData.hotel_state || '—';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Compact back link */}
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: the invoice document */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-sm overflow-hidden">
            {/* Hotel header + Tax Invoice label */}
            <div className="p-6 border-b">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {invoiceData.hotel_name}
                  </h1>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                    {invoiceData.hotel_address && <div>{invoiceData.hotel_address}</div>}
                    <div>
                      {[invoiceData.hotel_city, invoiceData.hotel_state, invoiceData.hotel_pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {invoiceData.hotel_phone && <div>Phone: {invoiceData.hotel_phone}</div>}
                    {invoiceData.hotel_email && <div>Email: {invoiceData.hotel_email}</div>}
                    {invoiceData.hotel_gst_number && (
                      <div className="font-medium text-gray-700 dark:text-gray-300">
                        GSTIN: {invoiceData.hotel_gst_number}
                      </div>
                    )}
                    {invoiceData.hotel_state && <div>State: {invoiceData.hotel_state}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-4 py-1.5 rounded bg-gray-900 text-white font-bold tracking-wide">
                    TAX INVOICE
                  </div>
                  <div className="mt-3 text-sm space-y-0.5">
                    <div>
                      <span className="text-gray-500">Invoice No: </span>
                      <span className="font-semibold">{invoiceData.invoice_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date: </span>
                      {new Date(invoiceData.invoice_date).toLocaleDateString('en-IN')}
                    </div>
                    {invoiceData.due_date && (
                      <div>
                        <span className="text-gray-500">Due: </span>
                        {new Date(invoiceData.due_date).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill-to + Place of supply + Booking reference */}
            <div className="p-6 border-b grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Bill To</div>
                <div className="font-medium text-gray-900 dark:text-white">{invoiceData.customer_name}</div>
                {invoiceData.customer_address && (
                  <div className="text-gray-600 dark:text-gray-400">{invoiceData.customer_address}</div>
                )}
                {(invoiceData.customer_city || invoiceData.customer_state || invoiceData.customer_pincode) && (
                  <div className="text-gray-600 dark:text-gray-400">
                    {[invoiceData.customer_city, invoiceData.customer_state, invoiceData.customer_pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {invoiceData.customer_phone && (
                  <div className="text-gray-600 dark:text-gray-400">Phone: {invoiceData.customer_phone}</div>
                )}
                {invoiceData.customer_email && (
                  <div className="text-gray-600 dark:text-gray-400">Email: {invoiceData.customer_email}</div>
                )}
                {invoiceData.customer_gst_number && (
                  <div className="font-medium text-gray-700 dark:text-gray-300 mt-1">
                    GSTIN: {invoiceData.customer_gst_number}
                  </div>
                )}
                <div className="text-gray-600 dark:text-gray-400 mt-1">
                  <span className="text-gray-500">Place of Supply: </span>
                  {placeOfSupply}
                </div>
              </div>

              {invoiceData.booking?.booking_number && (
                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Booking Reference</div>
                  <div className="space-y-0.5 text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="text-gray-500">Booking No: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {invoiceData.booking.booking_number}
                      </span>
                    </div>
                    {invoiceData.booking.check_in_date && (
                      <div>
                        <span className="text-gray-500">Check-in: </span>
                        {new Date(invoiceData.booking.check_in_date).toLocaleDateString('en-IN')}
                      </div>
                    )}
                    {invoiceData.booking.check_out_date && (
                      <div>
                        <span className="text-gray-500">Check-out: </span>
                        {new Date(invoiceData.booking.check_out_date).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Line items table with HSN/SAC + CGST/SGST */}
            <div className="p-6 border-b overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-gray-600 dark:text-gray-400">
                    <th className="text-left py-2 pr-2">#</th>
                    <th className="text-left py-2 pr-2">Description</th>
                    <th className="text-left py-2 px-2">HSN/SAC</th>
                    <th className="text-center py-2 px-2">Qty</th>
                    <th className="text-right py-2 px-2">Rate</th>
                    <th className="text-right py-2 px-2">Taxable</th>
                    <th className="text-right py-2 px-2">CGST</th>
                    <th className="text-right py-2 px-2">SGST</th>
                    <th className="text-right py-2 pl-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => {
                    const rate = item.tax_rate || 0;
                    const taxAmount = item.tax_amount || 0;
                    const taxableValue = (item.line_total || 0) - taxAmount;
                    const { cgstRate, sgstRate, cgstAmount, sgstAmount } = splitGst(taxAmount, rate);
                    return (
                      <tr key={item.id} className="border-b align-top">
                        <td className="py-3 pr-2">{index + 1}</td>
                        <td className="py-3 pr-2">
                          <div className="font-medium text-gray-900 dark:text-white">{item.description}</div>
                          {item.item_date && (
                            <div className="text-xs text-gray-500">
                              {new Date(item.item_date).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">{getHsnSac(item)}</td>
                        <td className="text-center py-3 px-2">{item.quantity}</td>
                        <td className="text-right py-3 px-2 whitespace-nowrap">
                          {formatCurrency(item.unit_price, currency)}
                        </td>
                        <td className="text-right py-3 px-2 whitespace-nowrap">
                          {formatCurrency(taxableValue, currency)}
                        </td>
                        <td className="text-right py-3 px-2 whitespace-nowrap">
                          {rate > 0 ? (
                            <>
                              {formatCurrency(cgstAmount, currency)}
                              <div className="text-xs text-gray-500">{cgstRate}%</div>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="text-right py-3 px-2 whitespace-nowrap">
                          {rate > 0 ? (
                            <>
                              {formatCurrency(sgstAmount, currency)}
                              <div className="text-xs text-gray-500">{sgstRate}%</div>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="text-right py-3 pl-2 font-medium whitespace-nowrap">
                          {formatCurrency(item.line_total, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tax summary + totals + amount in words */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GST breakdown table */}
              <div>
                {Object.keys(gstByRate).length > 0 && (
                  <>
                    <div className="text-xs font-semibold uppercase text-gray-500 mb-2">GST Summary</div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-600 dark:text-gray-400">
                          <th className="text-left py-1">Rate</th>
                          <th className="text-right py-1">Taxable</th>
                          <th className="text-right py-1">CGST</th>
                          <th className="text-right py-1">SGST</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(gstByRate).map(([rate, b]) => (
                          <tr key={rate} className="border-b">
                            <td className="py-1">{rate}%</td>
                            <td className="text-right py-1">{formatCurrency(b.taxable, currency)}</td>
                            <td className="text-right py-1">{formatCurrency(b.cgst, currency)}</td>
                            <td className="text-right py-1">{formatCurrency(b.sgst, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taxable Value</span>
                  <span>{formatCurrency(totalTaxable, currency)}</span>
                </div>
                {invoiceData.total_discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoiceData.total_discount, currency)}</span>
                  </div>
                )}
                {totalTax > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">CGST</span>
                      <span>{formatCurrency(totalCgst, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SGST</span>
                      <span>{formatCurrency(totalSgst, currency)}</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(invoiceData.total_amount, currency)}</span>
                </div>
              </div>

              {/* Amount in words spans full width */}
              <div className="md:col-span-2 rounded border bg-white dark:bg-gray-900 p-3 text-sm">
                <span className="font-medium">Amount in Words: </span>
                {numberToWords(invoiceData.total_amount)}
              </div>

              {/* Bank details (from hotel config) */}
              {hotelConfig && (hotelConfig.bank_name || hotelConfig.bank_account_number) && (
                <div className="md:col-span-2 text-sm">
                  <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Bank Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 text-gray-600 dark:text-gray-400">
                    {hotelConfig.bank_name && <div>Bank: {hotelConfig.bank_name}</div>}
                    {hotelConfig.bank_account_number && <div>A/c: {hotelConfig.bank_account_number}</div>}
                    {hotelConfig.bank_ifsc_code && <div>IFSC: {hotelConfig.bank_ifsc_code}</div>}
                    {hotelConfig.bank_branch && <div>Branch: {hotelConfig.bank_branch}</div>}
                  </div>
                </div>
              )}

              {/* Terms */}
              {invoiceData.terms_and_conditions && (
                <div className="md:col-span-2 text-sm">
                  <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Terms &amp; Conditions</div>
                  <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {invoiceData.terms_and_conditions}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: actions / status / summary / payments */}
        <div className="space-y-6">
          {/* Status + actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{invoiceData.invoice_number}</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {getStatusBadge(invoiceData.status, 'invoice')}
                {getStatusBadge(invoiceData.payment_status, 'payment')}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push(`/invoices/${invoiceId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              {invoiceData.balance_amount > 0 && (
                <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Payment
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-medium">{formatCurrency(invoiceData.total_amount, currency)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid</span>
                <span>{formatCurrency(invoiceData.paid_amount || 0, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Balance Due</span>
                <span className={invoiceData.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(invoiceData.balance_amount || 0, currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment history */}
          {invoiceData.payments && invoiceData.payments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {invoiceData.payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-start justify-between border-b last:border-0 pb-2 last:pb-0">
                    <div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(payment.amount, currency)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {payment.payment_method?.replace('_', ' ')}
                        {payment.reference_number ? ` • ${payment.reference_number}` : ''}
                      </div>
                      {payment.notes && <div className="text-xs text-gray-500">{payment.notes}</div>}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Internal notes */}
          {invoiceData.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                {invoiceData.notes}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoice={invoice}
        onPaymentAdded={fetchInvoice}
      />
    </div>
  );
}
