'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Invoice, InvoiceFormData } from '@/lib/types/invoice';
import InvoiceForm from '../../components/InvoiceForm';

interface InvoiceEditFormProps {
  invoiceId: string;
}

export default function InvoiceEditForm({ invoiceId }: InvoiceEditFormProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
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
    };

    fetchInvoice();
  }, [invoiceId, router]);

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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Invoice not found</h3>
        <button 
          onClick={() => router.push('/invoices')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  // Convert invoice data to form data format
  // Type assertion for database invoice data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  const initialFormData: Partial<InvoiceFormData> = {
    invoice_number: invoiceData.invoice_number,
    invoice_date: invoiceData.invoice_date,
    due_date: invoiceData.due_date || undefined,
    customer_id: invoiceData.customer_id || undefined,
    customer_name: invoiceData.customer_name,
    customer_email: invoiceData.customer_email || undefined,
    customer_phone: invoiceData.customer_phone || undefined,
    customer_address: invoiceData.customer_address || undefined,
    customer_city: invoiceData.customer_city || undefined,
    customer_state: invoiceData.customer_state || undefined,
    customer_pincode: invoiceData.customer_pincode || undefined,
    customer_country: invoiceData.customer_country || undefined,
    customer_gst_number: invoiceData.customer_gst_number || undefined,
    hotel_name: invoiceData.hotel_name,
    hotel_address: invoiceData.hotel_address,
    hotel_city: invoiceData.hotel_city,
    hotel_state: invoiceData.hotel_state,
    hotel_pincode: invoiceData.hotel_pincode,
    hotel_country: invoiceData.hotel_country,
    hotel_phone: invoiceData.hotel_phone || undefined,
    hotel_email: invoiceData.hotel_email || undefined,
    hotel_gst_number: invoiceData.hotel_gst_number || undefined,
    hotel_website: invoiceData.hotel_website || undefined,
    currency: invoiceData.currency,
    status: invoiceData.status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    notes: invoiceData.notes || undefined,
    terms_and_conditions: invoiceData.terms_and_conditions || undefined,
    booking_id: invoiceData.booking_id || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    line_items: invoiceData.line_items?.map((item: any) => ({
      id: item.id,
      item_type: item.item_type as 'room' | 'food' | 'service' | 'extra' | 'discount' | 'other' | 'custom',
      custom_item_type_id: undefined, // Not in database yet
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
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
    })) || [],
  };

  return (
    <InvoiceForm
      initialData={initialFormData}
      invoiceId={invoiceId}
      mode="edit"
    />
  );
}
