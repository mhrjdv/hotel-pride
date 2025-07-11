import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendInvoiceEmail, sendPaymentReminderEmail } from '@/lib/utils/email-service';
import { InvoiceEmailData } from '@/lib/types/invoice';

// POST /api/invoices/[id]/email - Send invoice via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json();
    const emailData: InvoiceEmailData = body.emailData;
    const reminderType = body.reminderType; // 'gentle' | 'urgent' | 'final'

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Validate email recipient
    if (!emailData.to && !invoice.customer_email) {
      return NextResponse.json(
        { success: false, error: 'No email address provided' },
        { status: 400 }
      );
    }

    // Use customer email if no specific recipient provided
    if (!emailData.to) {
      emailData.to = invoice.customer_email!;
    }

    let result;

    if (reminderType) {
      // Send payment reminder
      result = await sendPaymentReminderEmail(invoice, reminderType);
    } else {
      // Send regular invoice email
      result = await sendInvoiceEmail(invoice, emailData, emailData.attach_pdf);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft' && !reminderType) {
      await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          updated_by: user.id 
        })
        .eq('id', id);
    }

    // Log the email activity (you could create an email_logs table for this)
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.messageId,
        recipient: emailData.to,
        type: reminderType ? 'reminder' : 'invoice',
      },
      message: reminderType 
        ? 'Payment reminder sent successfully'
        : 'Invoice sent successfully',
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/invoices/[id]/email:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/invoices/[id]/email/preview - Preview email content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reminderType = searchParams.get('reminderType') as 'gentle' | 'urgent' | 'final' | null;

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

    // Import the email template generator
    const { generateInvoiceEmailTemplate } = await import('@/lib/utils/email-service');
    
    // Generate email preview
    let emailContent = generateInvoiceEmailTemplate(invoice);
    let subject = `Invoice ${invoice.invoice_number} from ${invoice.hotel_name}`;

    if (reminderType) {
      const reminderMessages = {
        gentle: {
          subject: `Payment Reminder: Invoice ${invoice.invoice_number}`,
          message: `
            <p>Dear ${invoice.customer_name},</p>
            <p>This is a friendly reminder that your invoice ${invoice.invoice_number} dated ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')} has an outstanding balance of ₹${invoice.balance_amount.toLocaleString('en-IN')}.</p>
            <p>If you have already made the payment, please disregard this message. Otherwise, we would appreciate your prompt payment.</p>
          `,
        },
        urgent: {
          subject: `Urgent: Payment Overdue - Invoice ${invoice.invoice_number}`,
          message: `
            <p>Dear ${invoice.customer_name},</p>
            <p>Your invoice ${invoice.invoice_number} is now overdue. The outstanding balance of ₹${invoice.balance_amount.toLocaleString('en-IN')} was due on ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'the due date'}.</p>
            <p>Please arrange for immediate payment to avoid any inconvenience.</p>
          `,
        },
        final: {
          subject: `Final Notice: Invoice ${invoice.invoice_number}`,
          message: `
            <p>Dear ${invoice.customer_name},</p>
            <p>This is a final notice for your overdue invoice ${invoice.invoice_number}. The outstanding balance of ₹${invoice.balance_amount.toLocaleString('en-IN')} is significantly overdue.</p>
            <p>Please contact us immediately to resolve this matter.</p>
          `,
        },
      };

      const reminder = reminderMessages[reminderType];
      subject = reminder.subject;
      emailContent = emailContent.replace(
        /Thank you for choosing[\s\S]*?Please find your invoice details below:/,
        reminder.message
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subject,
        content: emailContent,
        recipient: invoice.customer_email || '',
        type: reminderType || 'invoice',
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]/email/preview:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
