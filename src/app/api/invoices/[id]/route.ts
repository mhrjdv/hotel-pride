import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InvoiceFormData } from '@/lib/types/invoice';
import { calculateInvoiceTotal } from '@/lib/utils/invoice-calculations';

// GET /api/invoices/[id] - Get single invoice with line items and payments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // Fetch invoice with related data
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

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body: InvoiceFormData = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if invoice exists
    const { error: checkError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }
      console.error('Error checking invoice:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check invoice' },
        { status: 500 }
      );
    }

    // Calculate totals
    const calculations = calculateInvoiceTotal(body.line_items);

    // Update invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        invoice_date: body.invoice_date,
        due_date: body.due_date,
        customer_id: body.customer_id,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_address: body.customer_address,
        customer_city: body.customer_city,
        customer_state: body.customer_state,
        customer_pincode: body.customer_pincode,
        customer_country: body.customer_country || 'India',
        customer_gst_number: body.customer_gst_number,
        hotel_name: body.hotel_name,
        hotel_address: body.hotel_address,
        hotel_city: body.hotel_city,
        hotel_state: body.hotel_state,
        hotel_pincode: body.hotel_pincode,
        hotel_country: body.hotel_country || 'India',
        hotel_phone: body.hotel_phone,
        hotel_email: body.hotel_email,
        hotel_gst_number: body.hotel_gst_number,
        hotel_website: body.hotel_website,
        currency: body.currency || 'INR',
        subtotal: calculations.subtotal,
        total_tax: calculations.total_tax,
        total_discount: calculations.total_discount,
        total_amount: calculations.total_amount,
        status: body.status,
        notes: body.notes,
        terms_and_conditions: body.terms_and_conditions,
        booking_id: body.booking_id,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError);
      return NextResponse.json(
        { success: false, error: 'Failed to update invoice' },
        { status: 500 }
      );
    }

    // Delete existing line items
    const { error: deleteError } = await supabase
      .from('invoice_line_items')
      .delete()
      .eq('invoice_id', id);

    if (deleteError) {
      console.error('Error deleting line items:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to update invoice line items' },
        { status: 500 }
      );
    }

    // Create new line items
    if (body.line_items && body.line_items.length > 0) {
      const lineItemsData = body.line_items.map((item, index) => {
        const calculation = calculations.line_items[index];
        return {
          invoice_id: id,
          item_type: item.item_type,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: calculation.line_total,
          gst_rate: item.gst_rate,
          gst_amount: calculation.tax_amount,
          gst_inclusive: item.gst_inclusive,
          gst_name: item.gst_name || 'GST',
          discount_rate: item.discount_rate,
          discount_amount: calculation.discount_amount,
          item_date: item.item_date,
          sort_order: item.sort_order || index,
        };
      });

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) {
        console.error('Error creating line items:', lineItemsError);
        return NextResponse.json(
          { success: false, error: 'Failed to update invoice line items' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/invoices/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if invoice exists and can be deleted
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id, status, payment_status')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }
      console.error('Error checking invoice:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check invoice' },
        { status: 500 }
      );
    }

    // Prevent deletion of paid invoices
    if (existingInvoice.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete paid invoices' },
        { status: 400 }
      );
    }

    // Delete invoice (cascade will handle line items and payments)
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting invoice:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/invoices/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
