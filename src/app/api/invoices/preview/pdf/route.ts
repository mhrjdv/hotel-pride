import { NextRequest, NextResponse } from 'next/server';
import { InvoiceFormData } from '@/lib/types/invoice';
import { generateInvoicePDF } from '@/lib/utils/pdf-generator';
import { calculateInvoiceTotal } from '@/lib/utils/invoice-calculations';

export async function POST(request: NextRequest) {
  try {
    const formData: InvoiceFormData = await request.json();

    // Validate required fields
    if (!formData.customer_name) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!formData.line_items || formData.line_items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one line item is required' },
        { status: 400 }
      );
    }

    // Calculate totals first
    const calculations = calculateInvoiceTotal(formData.line_items.map(item => ({
      ...item,
      tax_rate: item.gst_rate,
      tax_inclusive: item.gst_inclusive,
      tax_name: item.gst_name,
    })));

    // Create a temporary invoice object for PDF generation
    const tempInvoice = {
      id: 'preview',
      invoice_number: formData.invoice_number || 'PREVIEW',
      invoice_date: formData.invoice_date,
      due_date: formData.due_date || null,
      invoice_type: formData.invoice_type,

      // Customer info
      customer_id: null,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email || null,
      customer_phone: formData.customer_phone || null,
      customer_address: formData.customer_address || null,
      customer_city: formData.customer_city || null,
      customer_state: formData.customer_state || null,
      customer_pincode: formData.customer_pincode || null,
      customer_country: formData.customer_country || null,
      customer_gst_number: formData.customer_gst_number || null,
      customer_type: formData.customer_type,
      company_name: formData.company_name || null,
      company_gst_number: formData.company_gst_number || null,
      company_pan_number: formData.company_pan_number || null,
      company_contact_person: formData.company_contact_person,

      // Hotel info
      hotel_name: formData.hotel_name,
      hotel_address: formData.hotel_address,
      hotel_city: formData.hotel_city,
      hotel_state: formData.hotel_state,
      hotel_pincode: formData.hotel_pincode,
      hotel_country: formData.hotel_country,
      hotel_phone: formData.hotel_phone || null,
      hotel_email: formData.hotel_email || null,
      hotel_gst_number: formData.hotel_gst_number || null,
      hotel_website: formData.hotel_website || null,

      // Calculated amounts
      currency: formData.currency,
      exchange_rate: null,
      subtotal: calculations.subtotal,
      total_tax: calculations.total_tax,
      total_discount: calculations.total_discount,
      total_amount: calculations.total_amount,
      paid_amount: 0,
      balance_amount: calculations.total_amount,

      // Settings
      show_bank_details: formData.show_bank_details,
      status: 'draft',
      payment_status: 'pending',
      notes: formData.notes || null,
      terms_and_conditions: formData.terms_and_conditions || null,

      // Metadata
      booking_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,

      // Line items (transform to match expected format)
      line_items: formData.line_items.map((item, index) => {
        const lineCalc = calculations.line_items[index];
        return {
          id: `preview-item-${index}`,
          invoice_id: 'preview',
          item_type: item.item_type,
          custom_item_type_id: item.custom_item_type_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: lineCalc?.final_amount || 0,
          tax_rate: item.gst_rate,
          tax_amount: lineCalc?.tax_amount || 0,
          tax_inclusive: item.gst_inclusive,
          tax_name: item.gst_name,
          discount_rate: item.discount_rate,
          discount_amount: lineCalc?.discount_amount || 0,
          is_buffet_item: item.is_buffet_item,
          buffet_type: item.buffet_type || null,
          persons_count: item.persons_count,
          price_per_person: item.price_per_person,
          item_date: item.item_date || null,
          sort_order: item.sort_order,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }),

      // Empty arrays for preview
      payments: [],
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(tempInvoice, {
      format: 'A4',
      orientation: 'portrait',
      include_payments: false,
      include_terms: true,
      watermark: 'PREVIEW',
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${formData.invoice_type}-preview.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating preview PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF preview' },
      { status: 500 }
    );
  }
}
