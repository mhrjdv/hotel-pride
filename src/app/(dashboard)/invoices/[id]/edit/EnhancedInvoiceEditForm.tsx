'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { InvoiceFormData } from '@/lib/types/invoice';
import EnhancedInvoiceForm from '../../components/EnhancedInvoiceForm';

interface EnhancedInvoiceEditFormProps {
  invoiceId: string;
}

export default function EnhancedInvoiceEditForm({ invoiceId }: EnhancedInvoiceEditFormProps) {
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<Partial<InvoiceFormData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/invoices/${invoiceId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load invoice');
        }

        if (data.success) {
          const invoice = data.data;
          
          // Transform the invoice data to match the form structure
          const formData: Partial<InvoiceFormData> = {
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            invoice_type: invoice.invoice_type || 'invoice',
            
            // Customer info
            customer_type: invoice.customer_type || 'individual',
            customer_name: invoice.customer_name,
            customer_email: invoice.customer_email,
            customer_phone: invoice.customer_phone,
            customer_address: invoice.customer_address,
            customer_city: invoice.customer_city,
            customer_state: invoice.customer_state,
            customer_pincode: invoice.customer_pincode,
            customer_country: invoice.customer_country,
            customer_gst_number: invoice.customer_gst_number,
            
            // Company info (if applicable)
            company_name: invoice.company_name,
            company_gst_number: invoice.company_gst_number,
            company_pan_number: invoice.company_pan_number,
            company_contact_person: invoice.company_contact_person,
            
            // Hotel info
            hotel_name: invoice.hotel_name,
            hotel_address: invoice.hotel_address,
            hotel_city: invoice.hotel_city,
            hotel_state: invoice.hotel_state,
            hotel_pincode: invoice.hotel_pincode,
            hotel_country: invoice.hotel_country,
            hotel_phone: invoice.hotel_phone,
            hotel_email: invoice.hotel_email,
            hotel_gst_number: invoice.hotel_gst_number,
            hotel_website: invoice.hotel_website,
            
            // Settings
            currency: invoice.currency,
            show_bank_details: invoice.show_bank_details !== false, // Default to true
            is_email_enabled: invoice.is_email_enabled !== false, // Default to true
            
            // Status
            status: invoice.status,
            
            // Notes
            notes: invoice.notes,
            terms_and_conditions: invoice.terms_and_conditions,
            
            // Related
            booking_id: invoice.booking_id,
            
            // Line items - transform to match form structure
            line_items: (invoice.line_items || []).map((item: { [key: string]: unknown }) => ({
              id: item.id,
              item_type: item.item_type || 'room',
              custom_item_type_id: item.custom_item_type_id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              
              // GST (renamed from tax)
              gst_rate: item.tax_rate || 12,
              gst_inclusive: item.tax_inclusive || false,
              gst_name: item.tax_name || 'GST',
              
              // Discount
              discount_rate: item.discount_rate || 0,
              
              // Buffet specific
              is_buffet_item: item.is_buffet_item || false,
              buffet_type: item.buffet_type,
              persons_count: item.persons_count || 1,
              price_per_person: item.price_per_person || 0,
              
              // Metadata
              item_date: item.item_date,
              sort_order: item.sort_order || 0,
            })),
          };

          setInvoiceData(formData);
        } else {
          throw new Error(data.error || 'Failed to load invoice');
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        setError(error instanceof Error ? error.message : 'Failed to load invoice');
        toast.error('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Form Loading */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-40 bg-gray-200 rounded animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Loading */}
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="h-96 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Invoice</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoiceData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Not Found</h3>
            <p className="text-gray-600">The requested invoice could not be found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <EnhancedInvoiceForm 
      mode="edit" 
      invoiceId={invoiceId}
      initialData={invoiceData}
    />
  );
}
