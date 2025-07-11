import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InvoiceFormData } from '@/lib/types/invoice';
import { calculateInvoiceTotal } from '@/lib/utils/invoice-calculations';

// GET /api/invoices - List invoices with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const payment_status = searchParams.get('payment_status');
    const customer_id = searchParams.get('customer_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        customer_name,
        customer_email,
        total_amount,
        paid_amount,
        balance_amount,
        status,
        payment_status,
        created_at,
        customer_id,
        booking_id
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }
    
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }
    
    if (date_from) {
      query = query.gte('invoice_date', date_from);
    }
    
    if (date_to) {
      query = query.lte('invoice_date', date_to);
    }
    
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoices || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body: InvoiceFormData = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate invoice number if not provided
    let invoiceNumber = body.invoice_number;
    if (!invoiceNumber) {
      const invoiceType = body.invoice_type || 'invoice';
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_invoice_number_by_type', { inv_type: invoiceType });

      if (numberError) {
        console.error('Error generating invoice number:', numberError);
        // Fallback to simple generation
        const prefix = invoiceType === 'proforma' ? 'PI' : 'INV';
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-4);
        invoiceNumber = `${prefix}-${year}-${timestamp}`;
      } else {
        invoiceNumber = numberData;
      }
    }

    // Calculate totals - map gst fields to tax fields for calculation
    const calculationItems = body.line_items.map(item => ({
      ...item,
      gst_rate: item.gst_rate || 12,
      gst_inclusive: item.gst_inclusive || false,
      gst_name: item.gst_name || 'GST',
    }));
    const calculations = calculateInvoiceTotal(calculationItems);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
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
        status: body.status || 'draft',
        notes: body.notes,
        terms_and_conditions: body.terms_and_conditions,
        booking_id: body.booking_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return NextResponse.json(
        { success: false, error: 'Failed to create invoice' },
        { status: 500 }
      );
    }

    // Create line items
    if (body.line_items && body.line_items.length > 0) {
      const lineItemsData = body.line_items.map((item, index) => {
        const calculation = calculations.line_items[index];
        return {
          invoice_id: invoice.id,
          item_type: item.item_type,
          custom_item_type_id: item.custom_item_type_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: calculation.line_total,
          tax_rate: item.gst_rate || 12,
          tax_amount: calculation.tax_amount,
          tax_inclusive: item.gst_inclusive || false,
          tax_name: item.gst_name || 'GST',
          discount_rate: item.discount_rate || 0,
          discount_amount: calculation.discount_amount,
          is_buffet_item: item.is_buffet_item || false,
          buffet_type: item.buffet_type || null,
          persons_count: item.persons_count || 1,
          price_per_person: item.price_per_person || 0,
          item_date: item.item_date || null,
          sort_order: item.sort_order || index,
        };
      });

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) {
        console.error('Error creating line items:', lineItemsError);
        // Try to clean up the invoice
        await supabase.from('invoices').delete().eq('id', invoice.id);
        return NextResponse.json(
          { success: false, error: 'Failed to create invoice line items' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
