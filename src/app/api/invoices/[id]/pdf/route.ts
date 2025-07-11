import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/utils/pdf-generator';
import { InvoicePDFOptions } from '@/lib/types/invoice';

// We'll use a simpler approach for PDF generation in production
// For now, let's create an HTML response that can be printed as PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Parse PDF options from query parameters
    const options: InvoicePDFOptions = {
      format: (searchParams.get('format') as 'A4' | 'Letter') || 'A4',
      orientation: (searchParams.get('orientation') as 'portrait' | 'landscape') || 'portrait',
      include_payments: searchParams.get('include_payments') !== 'false',
      include_terms: searchParams.get('include_terms') !== 'false',
      watermark: searchParams.get('watermark') || undefined,
    };

    // Fetch invoice with all related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*),
        payments:invoice_payments(*),
        customer:customers(id, name, email, phone),
        booking:bookings(id, booking_number, check_in_date, check_out_date)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching invoice:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoice' },
        { status: 500 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, options);

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]/pdf:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for generating actual PDF (when we implement server-side PDF generation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json();
    const options: InvoicePDFOptions = body.options || {};

    // Fetch invoice with all related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*),
        payments:invoice_payments(*),
        customer:customers(id, name, email, phone),
        booking:bookings(id, booking_number, check_in_date, check_out_date)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching invoice:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoice' },
        { status: 500 }
      );
    }

    // Generate PDF and return as base64 for client-side download
    const pdfBuffer = await generateInvoicePDF(invoice, options);

    return NextResponse.json({
      success: true,
      data: {
        pdf: pdfBuffer.toString('base64'),
        filename: `invoice-${invoice.invoice_number}.pdf`,
        contentType: 'application/pdf',
      },
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/invoices/[id]/pdf:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
