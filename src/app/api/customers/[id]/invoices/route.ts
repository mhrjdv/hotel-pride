import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // Fetch customer invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_type,
        invoice_date,
        due_date,
        total_amount,
        paid_amount,
        balance_amount,
        status,
        payment_status,
        created_at
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching customer invoices:', invoicesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customer invoices' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total_invoices: invoices.length,
      total_amount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      paid_amount: invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
      pending_amount: invoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        stats,
      },
    });
  } catch (error) {
    console.error('Error in customer invoices API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
