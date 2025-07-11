'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Building,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, INVOICE_STATUSES, PAYMENT_STATUSES } from '@/lib/types/invoice';
import { formatCurrency, calculateGSTBreakdown, numberToWords } from '@/lib/utils/invoice-calculations';
import PaymentDialog from './PaymentDialog';

interface InvoiceViewProps {
  invoiceId: string;
}

export default function InvoiceView({ invoiceId }: InvoiceViewProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
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

  const handleSendEmail = () => {
    router.push(`/invoices/${invoiceId}/email`);
  };

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  const getStatusBadge = (status: string, type: 'invoice' | 'payment') => {
    const statuses = type === 'invoice' ? INVOICE_STATUSES : PAYMENT_STATUSES;
    const statusConfig = statuses.find(s => s.value === status);
    
    if (!statusConfig) return <Badge variant="secondary">{status}</Badge>;

    const variants: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
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

  const gstBreakdown = calculateGSTBreakdown(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoiceData.line_items?.map((item: any) => ({
      item_type: (item.item_type as 'room' | 'food' | 'service' | 'extra' | 'discount' | 'other' | 'custom') ,
      custom_item_type_id: undefined, // Not in database yet
      description: item.description || '',
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      gst_rate: item.tax_rate || 0,
      gst_inclusive: item.tax_inclusive || false,
      gst_name: item.tax_name || 'GST',
      discount_rate: item.discount_rate || 0,
      is_buffet_item: false, // Not in database yet
      buffet_type: undefined,
      persons_count: 1,
      price_per_person: 0,
      item_date: item.item_date || undefined,
      sort_order: item.sort_order || 0,
    })) || []
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {invoiceData.invoice_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(invoiceData.status, 'invoice')}
              {getStatusBadge(invoiceData.payment_status, 'payment')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/invoices/${invoiceId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          {invoiceData.balance_amount > 0 && (
            <Button onClick={() => setPaymentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotel Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              From: {invoiceData.hotel_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>{invoiceData.hotel_address}</div>
            <div>{invoiceData.hotel_city}, {invoiceData.hotel_state} {invoiceData.hotel_pincode}</div>
            <div>{invoiceData.hotel_country}</div>
            {invoiceData.hotel_phone && <div>Phone: {invoiceData.hotel_phone}</div>}
            {invoiceData.hotel_email && <div>Email: {invoiceData.hotel_email}</div>}
            {invoiceData.hotel_gst_number && <div>GST: {invoiceData.hotel_gst_number}</div>}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Bill To: {invoiceData.customer_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invoiceData.customer_address && <div>{invoiceData.customer_address}</div>}
            {(invoiceData.customer_city || invoiceData.customer_state || invoiceData.customer_pincode) && (
              <div>
                {invoiceData.customer_city && `${invoiceData.customer_city}, `}
                {invoiceData.customer_state && `${invoiceData.customer_state} `}
                {invoiceData.customer_pincode}
              </div>
            )}
            {invoiceData.customer_country && invoiceData.customer_country !== 'India' && (
              <div>{invoiceData.customer_country}</div>
            )}
            {invoiceData.customer_phone && <div>Phone: {invoiceData.customer_phone}</div>}
            {invoiceData.customer_email && <div>Email: {invoiceData.customer_email}</div>}
            {invoiceData.customer_gst_number && <div>GST: {invoiceData.customer_gst_number}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Meta */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Invoice Date</div>
              <div className="font-medium">{new Date(invoiceData.invoice_date).toLocaleDateString('en-IN')}</div>
            </div>
            {invoiceData.due_date && (
              <div>
                <div className="text-gray-600 dark:text-gray-400">Due Date</div>
                <div className="font-medium">{new Date(invoiceData.due_date).toLocaleDateString('en-IN')}</div>
              </div>
            )}
            {invoiceData.booking?.booking_number && (
              <div>
                <div className="text-gray-600 dark:text-gray-400">Booking Reference</div>
                <div className="font-medium">{invoiceData.booking.booking_number}</div>
              </div>
            )}
            <div>
              <div className="text-gray-600 dark:text-gray-400">Currency</div>
              <div className="font-medium">{invoiceData.currency}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Rate</th>
                  <th className="text-center py-2">Tax%</th>
                  <th className="text-right py-2">Tax</th>
                  <th className="text-right py-2">Discount</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {invoiceData.line_items?.map((item: any, index: number) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">{index + 1}</td>
                    <td className="py-3">
                      <div className="font-medium">{item.description}</div>
                      {item.item_date && (
                        <div className="text-sm text-gray-500">
                          Date: {new Date(item.item_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3">{formatCurrency(item.unit_price, invoiceData.currency)}</td>
                    <td className="text-center py-3">{item.tax_rate || 0}%</td>
                    <td className="text-right py-3">{formatCurrency(item.tax_amount || 0, invoiceData.currency)}</td>
                    <td className="text-right py-3">{formatCurrency(item.discount_amount || 0, invoiceData.currency)}</td>
                    <td className="text-right py-3 font-medium">{formatCurrency(item.line_total, invoiceData.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totals and GST Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST Breakdown */}
        {Object.keys(gstBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>GST Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Tax Rate</th>
                    <th className="text-right py-2">Taxable Amount</th>
                    <th className="text-right py-2">Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gstBreakdown).map(([rate, breakdown]) => (
                    <tr key={rate} className="border-b">
                      <td className="py-2">{rate}%</td>
                      <td className="text-right py-2">{formatCurrency(breakdown.taxable_amount, invoiceData.currency)}</td>
                      <td className="text-right py-2">{formatCurrency(breakdown.tax_amount, invoiceData.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Invoice Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoiceData.subtotal, invoiceData.currency)}</span>
              </div>
              {invoiceData.total_discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(invoiceData.total_discount, invoiceData.currency)}</span>
                </div>
              )}
              {invoiceData.total_tax > 0 && (
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>{formatCurrency(invoiceData.total_tax, invoiceData.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>{formatCurrency(invoiceData.total_amount, invoiceData.currency)}</span>
              </div>
              {invoiceData.paid_amount > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Paid Amount:</span>
                    <span>{formatCurrency(invoiceData.paid_amount, invoiceData.currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Balance Due:</span>
                    <span className={invoiceData.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(invoiceData.balance_amount, invoiceData.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
              <div className="font-medium mb-1">Amount in Words:</div>
              <div>{numberToWords(invoiceData.total_amount)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {invoiceData.payments && invoiceData.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-left py-2">Reference</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-left py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {invoiceData.payments.map((payment: any) => (
                    <tr key={payment.id} className="border-b">
                      <td className="py-3">{new Date(payment.payment_date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                      <td className="py-3">{payment.reference_number || '-'}</td>
                      <td className="text-right py-3 font-medium text-green-600">
                        {formatCurrency(payment.amount, invoiceData.currency)}
                      </td>
                      <td className="py-3">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes and Terms */}
      {(invoiceData.notes || invoiceData.terms_and_conditions) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {invoiceData.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm whitespace-pre-wrap">{invoiceData.notes}</div>
              </CardContent>
            </Card>
          )}

          {invoiceData.terms_and_conditions && (
            <Card>
              <CardHeader>
                <CardTitle>Terms and Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm whitespace-pre-wrap">{invoiceData.terms_and_conditions}</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
