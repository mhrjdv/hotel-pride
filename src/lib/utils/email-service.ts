import nodemailer from 'nodemailer';
import { Invoice, InvoiceEmailData } from '@/lib/types/invoice';
import { generateInvoiceHTML } from './pdf-generator';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

/**
 * Create nodemailer transporter
 */
function createTransporter() {
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    throw new Error('SMTP credentials not configured');
  }

  return nodemailer.createTransport(emailConfig);
}

/**
 * Generate default email template for invoice
 */
export function generateInvoiceEmailTemplate(invoice: Invoice): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f8fafc;
            padding: 20px;
            border: 1px solid #e5e7eb;
        }
        .footer {
            background-color: #374151;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 12px;
        }
        .invoice-details {
            background-color: white;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${invoice.hotel_name}</h1>
        <p>Invoice ${invoice.invoice_number}</p>
    </div>
    
    <div class="content">
        <p>Dear ${invoice.customer_name},</p>
        
        <p>Thank you for choosing ${invoice.hotel_name}. Please find your invoice details below:</p>
        
        <div class="invoice-details">
            <h3>Invoice Summary</h3>
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</p>
            ${invoice.due_date ? `<p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-IN')}</p>` : ''}
            ${invoice.booking?.booking_number ? `<p><strong>Booking Reference:</strong> ${invoice.booking.booking_number}</p>` : ''}
            
            <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #2563eb;">
                <p style="margin: 0;"><strong>Total Amount:</strong></p>
                <p class="amount" style="margin: 5px 0 0 0;">₹${invoice.total_amount.toLocaleString('en-IN')}</p>
                ${invoice.balance_amount > 0 ? `<p style="margin: 5px 0 0 0; color: #dc2626;"><strong>Balance Due:</strong> ₹${invoice.balance_amount.toLocaleString('en-IN')}</p>` : ''}
            </div>
        </div>
        
        <p>The detailed invoice is attached to this email as a PDF document.</p>
        
        ${invoice.balance_amount > 0 ? `
        <p style="color: #dc2626;"><strong>Payment Required:</strong> Please settle the outstanding balance of ₹${invoice.balance_amount.toLocaleString('en-IN')} by ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'the due date'}.</p>
        ` : `
        <p style="color: #059669;"><strong>Payment Status:</strong> This invoice has been fully paid. Thank you!</p>
        `}
        
        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        ${invoice.hotel_name}<br>
        ${invoice.hotel_phone ? `Phone: ${invoice.hotel_phone}<br>` : ''}
        ${invoice.hotel_email ? `Email: ${invoice.hotel_email}` : ''}</p>
    </div>
    
    <div class="footer">
        <p>This is an automated email. Please do not reply to this email address.</p>
        <p>${invoice.hotel_name} | ${invoice.hotel_address}, ${invoice.hotel_city}</p>
    </div>
</body>
</html>
  `;
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  emailData: InvoiceEmailData,
  attachPDF: boolean = true
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();

    // Generate email content
    const htmlContent = emailData.message || generateInvoiceEmailTemplate(invoice);

    // Prepare email options
    const mailOptions: {
      from: { name: string; address: string };
      to: string;
      cc?: string[];
      bcc?: string[];
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
    } = {
      from: {
        name: invoice.hotel_name,
        address: emailConfig.auth.user!,
      },
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      subject: emailData.subject || `Invoice ${invoice.invoice_number} from ${invoice.hotel_name}`,
      html: htmlContent,
      attachments: [],
    };

    // Add PDF attachment if requested
    if (attachPDF && emailData.attach_pdf) {
      const invoiceHTML = generateInvoiceHTML(invoice, {
        format: 'A4',
        orientation: 'portrait',
        include_payments: true,
        include_terms: true,
      });

      // For now, we'll attach the HTML version
      // In production, you would convert this to PDF using puppeteer or similar
      if (!mailOptions.attachments) {
        mailOptions.attachments = [];
      }
      mailOptions.attachments.push({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filename: `invoice-${(invoice as any).invoice_number}.html`,
        content: Buffer.from(invoiceHTML, 'utf8'),
        contentType: 'text/html',
      });
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  invoice: Invoice,
  reminderType: 'gentle' | 'urgent' | 'final' = 'gentle'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();

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
    const htmlContent = generateInvoiceEmailTemplate(invoice).replace(
      /Thank you for choosing[\s\S]*?Please find your invoice details below:/,
      reminder.message
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(invoice as any).customer_email) {
      throw new Error('Customer email is required for sending payment reminder');
    }

    const mailOptions = {
      from: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any  
        name: (invoice as any).hotel_name,
        address: emailConfig.auth.user!,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to: (invoice as any).customer_email,
      subject: reminder.subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messageId: (info as any).messageId,
    };
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reminder',
    };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email configuration test failed',
    };
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(
  to: string,
  hotelName: string = 'Hotel Pride'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: hotelName,
        address: emailConfig.auth.user!,
      },
      to,
      subject: 'Test Email from Hotel Management System',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email from your hotel management system.</p>
        <p>If you received this email, your SMTP configuration is working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
    };
  }
}
