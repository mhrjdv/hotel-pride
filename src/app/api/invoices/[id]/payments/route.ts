import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InvoicePaymentFormData } from '@/lib/types/invoice';

// GET /api/invoices/[id]/payments - Get payments for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // Fetch payments for the invoice
    const { data: payments, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', id)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payments || [],
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]/payments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invoices/[id]/payments - Add payment to invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body: InvoicePaymentFormData = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if invoice exists
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total_amount, paid_amount, balance_amount, status')
      .eq('id', id)
      .single();

    if (invoiceError) {
      if (invoiceError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching invoice:', invoiceError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoice' },
        { status: 500 }
      );
    }

    // Validate payment amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (body.amount > invoice.balance_amount) {
      return NextResponse.json(
        { success: false, error: 'Payment amount cannot exceed balance amount' },
        { status: 400 }
      );
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: id,
        payment_date: body.payment_date,
        amount: body.amount,
        payment_method: body.payment_method,
        reference_number: body.reference_number,
        notes: body.notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    // The trigger will automatically update the invoice totals
    // But let's fetch the updated invoice to return current status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .select('paid_amount, balance_amount, payment_status')
      .eq('id', id)
      .single();

    if (updateError) {
      console.error('Error fetching updated invoice:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        payment,
        invoice_status: updatedInvoice,
      },
      message: 'Payment added successfully',
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/invoices/[id]/payments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id]/payments/[paymentId] - Update payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const body: InvoicePaymentFormData = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if payment exists
    const { error: checkError } = await supabase
      .from('invoice_payments')
      .select('id, invoice_id, amount')
      .eq('id', paymentId)
      .eq('invoice_id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Payment not found' },
          { status: 404 }
        );
      }
      console.error('Error checking payment:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check payment' },
        { status: 500 }
      );
    }

    // Validate payment amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Update payment
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .update({
        payment_date: body.payment_date,
        amount: body.amount,
        payment_method: body.payment_method,
        reference_number: body.reference_number,
        notes: body.notes,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
      return NextResponse.json(
        { success: false, error: 'Failed to update payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/invoices/[id]/payments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id]/payments/[paymentId] - Delete payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if payment exists
    const { error: checkError } = await supabase
      .from('invoice_payments')
      .select('id')
      .eq('id', paymentId)
      .eq('invoice_id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Payment not found' },
          { status: 404 }
        );
      }
      console.error('Error checking payment:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check payment' },
        { status: 500 }
      );
    }

    // Delete payment
    const { error: deleteError } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', paymentId);

    if (deleteError) {
      console.error('Error deleting payment:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/invoices/[id]/payments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
