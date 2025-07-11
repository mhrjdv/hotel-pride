import { Invoice, InvoicePDFOptions } from '@/lib/types/invoice';
import { formatCurrency, numberToWords, calculateGSTBreakdown } from './invoice-calculations';

/**
 * Generate HTML template for invoice PDF
 */
export function generateInvoiceHTML(invoice: Invoice, options: InvoicePDFOptions = {
  format: 'A4',
  orientation: 'portrait',
  include_payments: true,
  include_terms: true,
}): string {
  // Type assertion for database invoice data with bank details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  const gstBreakdown = calculateGSTBreakdown(
    invoice.line_items?.map(item => ({
      item_type: (item.item_type as 'room' | 'food' | 'service' | 'extra' | 'discount' | 'other' | 'custom') || 'other',
      custom_item_type_id: undefined,
      description: item.description || '',
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      gst_rate: item.tax_rate || 0,
      gst_inclusive: item.tax_inclusive || false,
      gst_name: item.tax_name || 'GST',
      discount_rate: item.discount_rate || 0,
      is_buffet_item: false,
      buffet_type: undefined,
      persons_count: 1,
      price_per_person: 0,
      item_date: item.item_date || undefined,
      sort_order: item.sort_order || 0,
    })) || []
  );

  const totalInWords = numberToWords(invoice.total_amount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 20mm 15mm;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
            width: 210mm;
            min-height: 297mm;
        }

        .invoice-container {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .hotel-info {
            flex: 1;
        }
        
        .hotel-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        
        .hotel-details {
            font-size: 11px;
            color: #666;
            line-height: 1.3;
        }
        
        .invoice-info {
            text-align: right;
            flex: 1;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .invoice-meta {
            font-size: 11px;
        }
        
        .invoice-meta div {
            margin-bottom: 3px;
        }
        
        .customer-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .bill-to, .ship-to {
            flex: 1;
            margin-right: 20px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 3px;
        }
        
        .customer-details {
            font-size: 11px;
            line-height: 1.4;
        }
        
        .line-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }
        
        .line-items-table th {
            background-color: #f8fafc;
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            color: #374151;
        }
        
        .line-items-table td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            vertical-align: top;
        }
        
        .line-items-table .text-right {
            text-align: right;
        }
        
        .line-items-table .text-center {
            text-align: center;
        }
        
        .totals-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .gst-breakdown {
            flex: 1;
            margin-right: 20px;
        }
        
        .gst-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        
        .gst-table th,
        .gst-table td {
            border: 1px solid #e5e7eb;
            padding: 6px;
            text-align: right;
        }
        
        .gst-table th {
            background-color: #f8fafc;
            font-weight: bold;
        }
        
        .invoice-totals {
            flex: 1;
            max-width: 300px;
        }
        
        .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        
        .totals-table td {
            padding: 6px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-table .label {
            text-align: left;
            font-weight: 500;
        }
        
        .totals-table .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .total-row {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        
        .amount-in-words {
            background-color: #f8fafc;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 11px;
            font-weight: bold;
            color: #374151;
        }

        .bank-details-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background-color: #f8fafc;
        }

        .bank-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 10px;
        }

        .bank-details-column div {
            margin-bottom: 8px;
            font-size: 11px;
        }

        .payments-section {
            margin-bottom: 20px;
        }
        
        .payments-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        
        .payments-table th,
        .payments-table td {
            border: 1px solid #e5e7eb;
            padding: 6px;
        }
        
        .payments-table th {
            background-color: #f8fafc;
            font-weight: bold;
        }
        
        .terms-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .terms-content {
            font-size: 10px;
            line-height: 1.4;
            color: #666;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            color: rgba(0, 0, 0, 0.1);
            z-index: -1;
            font-weight: bold;
        }
        
        @media print {
            .invoice-container {
                padding: 0;
                max-width: none;
            }
            
            body {
                font-size: 11px;
            }
        }
    </style>
</head>
<body>
    ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
    
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="hotel-info">
                <div class="hotel-name">${invoice.hotel_name}</div>
                <div class="hotel-details">
                    ${invoice.hotel_address}<br>
                    ${invoice.hotel_city}, ${invoice.hotel_state} ${invoice.hotel_pincode}<br>
                    ${invoice.hotel_country}<br>
                    ${invoice.hotel_phone ? `Phone: ${invoice.hotel_phone}<br>` : ''}
                    ${invoice.hotel_email ? `Email: ${invoice.hotel_email}<br>` : ''}
                    ${invoice.hotel_gst_number ? `GST No: ${invoice.hotel_gst_number}<br>` : ''}
                    ${invoice.hotel_website ? `Website: ${invoice.hotel_website}` : ''}
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-meta">
                    <div><strong>Invoice #:</strong> ${invoice.invoice_number}</div>
                    <div><strong>Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</div>
                    ${invoice.due_date ? `<div><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-IN')}</div>` : ''}
                    ${invoice.booking?.booking_number ? `<div><strong>Booking #:</strong> ${invoice.booking.booking_number}</div>` : ''}
                </div>
            </div>
        </div>
        
        <!-- Customer Information -->
        <div class="customer-section">
            <div class="bill-to">
                <div class="section-title">Bill To</div>
                <div class="customer-details">
                    <strong>${invoice.customer_name}</strong><br>
                    ${invoice.customer_address ? `${invoice.customer_address}<br>` : ''}
                    ${invoice.customer_city ? `${invoice.customer_city}, ` : ''}${invoice.customer_state ? `${invoice.customer_state} ` : ''}${invoice.customer_pincode ? `${invoice.customer_pincode}<br>` : ''}
                    ${invoice.customer_country && invoice.customer_country !== 'India' ? `${invoice.customer_country}<br>` : ''}
                    ${invoice.customer_phone ? `Phone: ${invoice.customer_phone}<br>` : ''}
                    ${invoice.customer_email ? `Email: ${invoice.customer_email}<br>` : ''}
                    ${invoice.customer_gst_number ? `GST No: ${invoice.customer_gst_number}` : ''}
                </div>
            </div>
            ${invoice.booking ? `
            <div class="ship-to">
                <div class="section-title">Booking Details</div>
                <div class="customer-details">
                    <strong>Booking #:</strong> ${invoice.booking.booking_number}<br>
                    <strong>Check-in:</strong> ${new Date(invoice.booking.check_in_date).toLocaleDateString('en-IN')}<br>
                    <strong>Check-out:</strong> ${new Date(invoice.booking.check_out_date).toLocaleDateString('en-IN')}
                </div>
            </div>
            ` : ''}
        </div>
        
        <!-- Line Items -->
        <table class="line-items-table">
            <thead>
                <tr>
                    <th style="width: 5%">#</th>
                    <th style="width: 35%">Description</th>
                    <th style="width: 10%" class="text-center">Qty</th>
                    <th style="width: 12%" class="text-right">Rate</th>
                    <th style="width: 8%" class="text-center">Tax%</th>
                    <th style="width: 10%" class="text-right">Tax Amt</th>
                    <th style="width: 10%" class="text-right">Discount</th>
                    <th style="width: 10%" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.line_items?.map((item, index) => `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>
                        <strong>${item.description}</strong>
                        ${item.item_date ? `<br><small>Date: ${new Date(item.item_date).toLocaleDateString('en-IN')}</small>` : ''}
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unit_price, invoice.currency)}</td>
                    <td class="text-center">${item.tax_rate || 0}%</td>
                    <td class="text-right">${formatCurrency(item.tax_amount || 0, invoice.currency)}</td>
                    <td class="text-right">${formatCurrency(item.discount_amount || 0, invoice.currency)}</td>
                    <td class="text-right">${formatCurrency(item.line_total, invoice.currency)}</td>
                </tr>
                `).join('') || ''}
            </tbody>
        </table>
        
        <!-- Totals Section -->
        <div class="totals-section">
            ${Object.keys(gstBreakdown).length > 0 ? `
            <div class="gst-breakdown">
                <div class="section-title">GST Breakdown</div>
                <table class="gst-table">
                    <thead>
                        <tr>
                            <th>Tax Rate</th>
                            <th>Taxable Amount</th>
                            <th>Tax Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(gstBreakdown).map(([rate, breakdown]) => `
                        <tr>
                            <td>${rate}%</td>
                            <td>${formatCurrency(breakdown.taxable_amount, invoice.currency)}</td>
                            <td>${formatCurrency(breakdown.tax_amount, invoice.currency)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            <div class="invoice-totals">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal:</td>
                        <td class="amount">${formatCurrency(invoice.subtotal, invoice.currency)}</td>
                    </tr>
                    ${invoice.total_discount > 0 ? `
                    <tr>
                        <td class="label">Total Discount:</td>
                        <td class="amount">-${formatCurrency(invoice.total_discount, invoice.currency)}</td>
                    </tr>
                    ` : ''}
                    ${invoice.total_tax > 0 ? `
                    <tr>
                        <td class="label">Total Tax:</td>
                        <td class="amount">${formatCurrency(invoice.total_tax, invoice.currency)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td class="label">Total Amount:</td>
                        <td class="amount">${formatCurrency(invoice.total_amount, invoice.currency)}</td>
                    </tr>
                    ${invoice.paid_amount > 0 ? `
                    <tr>
                        <td class="label">Paid Amount:</td>
                        <td class="amount">${formatCurrency(invoice.paid_amount, invoice.currency)}</td>
                    </tr>
                    <tr>
                        <td class="label">Balance Due:</td>
                        <td class="amount">${formatCurrency(invoice.balance_amount, invoice.currency)}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
        </div>
        
        <!-- Amount in Words -->
        <div class="amount-in-words">
            <strong>Amount in Words:</strong> ${totalInWords}
        </div>

        ${invoiceData.show_bank_details && (invoiceData.bank_name || invoiceData.bank_account_number || invoiceData.bank_ifsc_code) ? `
        <!-- Bank Details -->
        <div class="bank-details-section">
            <div class="section-title">Bank Details</div>
            <div class="bank-details-grid">
                <div class="bank-details-column">
                    ${invoiceData.bank_name ? `<div><strong>Bank Name:</strong> ${invoiceData.bank_name}</div>` : ''}
                    ${invoiceData.bank_account_number ? `<div><strong>Account Number:</strong> ${invoiceData.bank_account_number}</div>` : ''}
                    ${invoiceData.bank_account_holder_name ? `<div><strong>Account Holder:</strong> ${invoiceData.bank_account_holder_name}</div>` : ''}
                </div>
                <div class="bank-details-column">
                    ${invoiceData.bank_ifsc_code ? `<div><strong>IFSC Code:</strong> ${invoiceData.bank_ifsc_code}</div>` : ''}
                    ${invoiceData.bank_branch ? `<div><strong>Branch:</strong> ${invoiceData.bank_branch}</div>` : ''}
                </div>
            </div>
        </div>
        ` : ''}

        ${options.include_payments && invoice.payments && invoice.payments.length > 0 ? `
        <!-- Payments -->
        <div class="payments-section">
            <div class="section-title">Payment History</div>
            <table class="payments-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th class="text-right">Amount</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.payments.map(payment => `
                    <tr>
                        <td>${new Date(payment.payment_date).toLocaleDateString('en-IN')}</td>
                        <td>${payment.payment_method.replace('_', ' ').toUpperCase()}</td>
                        <td>${payment.reference_number || '-'}</td>
                        <td class="text-right">${formatCurrency(payment.amount, invoice.currency)}</td>
                        <td>${payment.notes || '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
        
        ${options.include_terms && invoice.terms_and_conditions ? `
        <!-- Terms and Conditions -->
        <div class="terms-section">
            <div class="section-title">Terms and Conditions</div>
            <div class="terms-content">
                ${invoice.terms_and_conditions.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}
        
        ${invoice.notes ? `
        <!-- Notes -->
        <div class="terms-section">
            <div class="section-title">Notes</div>
            <div class="terms-content">
                ${invoice.notes.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate PDF buffer for invoice using Puppeteer
 */
export async function generateInvoicePDF(invoice: Invoice, options?: InvoicePDFOptions): Promise<Buffer> {
  try {
    // Dynamic import to avoid issues in edge runtime
    const puppeteer = await import('puppeteer');

    // Generate HTML
    const html = generateInvoiceHTML(invoice, options);

    // Launch browser
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF with A4 size
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      displayHeaderFooter: false,
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);

    // Fallback: return HTML as buffer (for development)
    const html = generateInvoiceHTML(invoice, options);
    return Buffer.from(html, 'utf-8');
  }
}
