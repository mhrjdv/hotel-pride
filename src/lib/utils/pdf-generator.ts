import { Invoice, InvoicePDFOptions } from '@/lib/types/invoice';
import { formatCurrency, numberToWords, calculateGSTBreakdown } from './invoice-calculations';

/**
 * HTML-escape a value so user-entered text (descriptions, names, notes) can't
 * break the markup or inject tags into the generated PDF.
 */
function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Derive the Indian SAC code for a line item from its type/description.
 * Mirrors invoice-display-helpers.getHsnSac so the PDF matches the on-screen
 * invoice. (HSN/SAC is not stored in the DB; it's derived for presentation.)
 */
function getHsnSac(itemType: string | null | undefined, description: string | null | undefined): string {
  const haystack = `${description || ''}`.toLowerCase();
  switch (itemType) {
    case 'room':
      return '996311';
    case 'food':
      return '996332';
    case 'discount':
      return '-';
  }
  if (/\b(room|accommodation|lodging|tariff|stay|night)\b/.test(haystack)) return '996311';
  if (/\b(food|beverage|buffet|breakfast|lunch|dinner|restaurant|meal|f&b)\b/.test(haystack)) return '996332';
  if (/\b(transport|cab|taxi|car|pickup|drop|airport)\b/.test(haystack)) return '9964';
  if (/\b(laundry|dry clean|washing)\b/.test(haystack)) return '9997';
  return '9997';
}

/** Split a GST amount/rate into equal CGST + SGST halves (intra-state supply). */
function splitGst(taxAmount: number, taxRate: number) {
  return {
    cgstRate: Math.round((taxRate / 2) * 100) / 100,
    sgstRate: Math.round((taxRate / 2) * 100) / 100,
    cgstAmount: Math.round((taxAmount / 2) * 100) / 100,
    sgstAmount: Math.round((taxAmount / 2) * 100) / 100,
  };
}

/**
 * Generate HTML template for invoice PDF.
 *
 * This intentionally mirrors the on-screen tax invoice (InvoiceView /
 * InvoiceLivePreview): GSTIN, HSN/SAC, CGST/SGST split, place of supply,
 * amount in words, bank details and totals — so the downloaded PDF matches
 * what the user previews. The layout paginates cleanly across multiple pages
 * (repeated table headers, avoid row splits) and right-aligns currency with
 * tabular figures so large/small amounts never overflow.
 */
export function generateInvoiceHTML(invoice: Invoice, options: InvoicePDFOptions = {
  format: 'A4',
  orientation: 'portrait',
  include_payments: true,
  include_terms: true,
}): string {
  // Type assertion for database invoice data with bank details / extra fields.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  const currency = invoice.currency || 'INR';
  const fc = (n: number) => esc(formatCurrency(n || 0, currency));

  const lineItems = invoice.line_items || [];

  const gstBreakdown = calculateGSTBreakdown(
    lineItems.map(item => ({
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
    }))
  );

  // Totals (aggregate taxable + CGST/SGST split) consistent with the on-screen view.
  const totalTax = invoice.total_tax || 0;
  const totalCgst = Math.round((totalTax / 2) * 100) / 100;
  const totalSgst = totalTax - totalCgst;
  const totalTaxable = lineItems.reduce(
    (sum, item) => sum + ((item.line_total || 0) - (item.tax_amount || 0)),
    0
  );

  const placeOfSupply = invoiceData.customer_state || invoiceData.hotel_state || '—';
  const totalInWords = numberToWords(invoice.total_amount);

  const invoiceTitle = (() => {
    switch (invoiceData.invoice_type) {
      case 'proforma': return 'PROFORMA INVOICE';
      case 'estimate': return 'ESTIMATE';
      case 'quote': return 'QUOTATION';
      default: return 'TAX INVOICE';
    }
  })();

  const showBank =
    invoiceData.show_bank_details &&
    (invoiceData.bank_name || invoiceData.bank_account_number || invoiceData.bank_ifsc_code);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${esc(invoice.invoice_number)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page { size: A4; margin: 14mm 12mm; }

        html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.45;
            color: #111827;
            background: #fff;
        }

        .invoice { width: 100%; }

        .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .muted { color: #6b7280; }
        .label { color: #6b7280; }
        .strong { font-weight: 600; }
        .uplabel {
            font-size: 9px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .04em; color: #6b7280; margin-bottom: 4px;
        }

        /* Header */
        .header {
            display: flex; justify-content: space-between; align-items: flex-start;
            gap: 24px; padding-bottom: 16px; border-bottom: 2px solid #111827; margin-bottom: 16px;
        }
        .hotel-name { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 4px; word-break: break-word; }
        .hotel-details { font-size: 10px; color: #4b5563; line-height: 1.5; word-break: break-word; }
        .hotel-details .gstin { font-weight: 600; color: #374151; }
        .invoice-meta-wrap { text-align: right; flex-shrink: 0; }
        .invoice-badge {
            display: inline-block; background: #111827; color: #fff; font-weight: 700;
            letter-spacing: .06em; padding: 6px 16px; border-radius: 4px; margin-bottom: 10px;
        }
        .invoice-meta { font-size: 10px; line-height: 1.6; }

        /* Parties */
        .parties {
            display: flex; gap: 24px; padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb; margin-bottom: 16px;
        }
        .party { flex: 1; font-size: 10px; line-height: 1.5; word-break: break-word; }
        .party .name { font-weight: 600; color: #111827; }

        /* Line items */
        .items {
            width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px;
            font-variant-numeric: tabular-nums;
        }
        .items thead { display: table-header-group; } /* repeat header on each page */
        .items th {
            background: #f3f4f6; border: 1px solid #e5e7eb; padding: 7px 8px;
            text-align: left; font-weight: 700; color: #374151;
        }
        .items td { border: 1px solid #e5e7eb; padding: 7px 8px; vertical-align: top; }
        .items tr { page-break-inside: avoid; }
        .items .desc { word-break: break-word; }
        .items .desc .sub { font-size: 9px; color: #6b7280; }
        .items .rate-sub { font-size: 9px; color: #6b7280; }

        /* Summary */
        .summary {
            display: flex; gap: 24px; align-items: flex-start; margin-bottom: 16px;
            page-break-inside: avoid;
        }
        .gst-table { width: 100%; border-collapse: collapse; font-size: 10px; font-variant-numeric: tabular-nums; }
        .gst-table th, .gst-table td { border: 1px solid #e5e7eb; padding: 5px 8px; }
        .gst-table th { background: #f3f4f6; font-weight: 700; text-align: right; }
        .gst-table th:first-child, .gst-table td:first-child { text-align: left; }
        .gst-table td { text-align: right; }
        .summary-left { flex: 1; }
        .summary-right { flex: 1; max-width: 280px; margin-left: auto; }

        .totals { width: 100%; font-size: 11px; font-variant-numeric: tabular-nums; }
        .totals td { padding: 4px 0; }
        .totals .t-label { text-align: left; color: #4b5563; }
        .totals .t-val { text-align: right; white-space: nowrap; }
        .totals .discount .t-val { color: #dc2626; }
        .totals .grand td { border-top: 2px solid #111827; padding-top: 8px; font-size: 13px; font-weight: 700; color: #111827; }

        .words {
            border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb;
            padding: 10px 12px; font-size: 10px; margin-bottom: 16px; page-break-inside: avoid;
        }

        .block { margin-bottom: 16px; font-size: 10px; page-break-inside: avoid; }
        .bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; color: #4b5563; }
        .terms-content { color: #4b5563; white-space: pre-wrap; word-break: break-word; }

        .pay-table { width: 100%; border-collapse: collapse; font-size: 10px; font-variant-numeric: tabular-nums; }
        .pay-table th, .pay-table td { border: 1px solid #e5e7eb; padding: 5px 8px; }
        .pay-table th { background: #f3f4f6; font-weight: 700; }

        .footer {
            margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb;
            text-align: center; font-size: 9px; color: #9ca3af;
        }

        .watermark {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 96px; color: rgba(17,24,39,0.06); font-weight: 800; z-index: -1;
        }
    </style>
</head>
<body>
    ${options.watermark ? `<div class="watermark">${esc(options.watermark)}</div>` : ''}

    <div class="invoice">
        <!-- Header -->
        <div class="header">
            <div>
                <div class="hotel-name">${esc(invoice.hotel_name)}</div>
                <div class="hotel-details">
                    ${invoice.hotel_address ? `${esc(invoice.hotel_address)}<br>` : ''}
                    ${[invoice.hotel_city, invoice.hotel_state, invoice.hotel_pincode].filter(Boolean).map(esc).join(', ')}<br>
                    ${invoice.hotel_phone ? `Phone: ${esc(invoice.hotel_phone)}<br>` : ''}
                    ${invoice.hotel_email ? `Email: ${esc(invoice.hotel_email)}<br>` : ''}
                    ${invoice.hotel_gst_number ? `<span class="gstin">GSTIN: ${esc(invoice.hotel_gst_number)}</span><br>` : ''}
                    ${invoice.hotel_state ? `State: ${esc(invoice.hotel_state)}` : ''}
                </div>
            </div>
            <div class="invoice-meta-wrap">
                <div class="invoice-badge">${invoiceTitle}</div>
                <div class="invoice-meta">
                    <div><span class="label">Invoice No: </span><span class="strong">${esc(invoice.invoice_number)}</span></div>
                    <div><span class="label">Date: </span>${esc(new Date(invoice.invoice_date).toLocaleDateString('en-IN'))}</div>
                    ${invoice.due_date ? `<div><span class="label">Due: </span>${esc(new Date(invoice.due_date).toLocaleDateString('en-IN'))}</div>` : ''}
                </div>
            </div>
        </div>

        <!-- Parties -->
        <div class="parties">
            <div class="party">
                <div class="uplabel">Bill To</div>
                ${invoiceData.company_name ? `<div class="name">${esc(invoiceData.company_name)}</div>` : ''}
                <div class="name">${esc(invoice.customer_name)}</div>
                ${invoice.customer_address ? `<div>${esc(invoice.customer_address)}</div>` : ''}
                ${[invoice.customer_city, invoice.customer_state, invoice.customer_pincode].filter(Boolean).length
                  ? `<div>${[invoice.customer_city, invoice.customer_state, invoice.customer_pincode].filter(Boolean).map(esc).join(', ')}</div>`
                  : ''}
                ${invoice.customer_phone ? `<div>Phone: ${esc(invoice.customer_phone)}</div>` : ''}
                ${invoice.customer_email ? `<div>Email: ${esc(invoice.customer_email)}</div>` : ''}
                ${invoice.customer_gst_number ? `<div class="strong">GSTIN: ${esc(invoice.customer_gst_number)}</div>` : ''}
                <div><span class="label">Place of Supply: </span>${esc(placeOfSupply)}</div>
            </div>
            ${invoice.booking?.booking_number ? `
            <div class="party">
                <div class="uplabel">Booking Reference</div>
                <div><span class="label">Booking No: </span><span class="strong">${esc(invoice.booking.booking_number)}</span></div>
                ${invoice.booking.check_in_date ? `<div><span class="label">Check-in: </span>${esc(new Date(invoice.booking.check_in_date).toLocaleDateString('en-IN'))}</div>` : ''}
                ${invoice.booking.check_out_date ? `<div><span class="label">Check-out: </span>${esc(new Date(invoice.booking.check_out_date).toLocaleDateString('en-IN'))}</div>` : ''}
            </div>
            ` : '<div class="party"></div>'}
        </div>

        <!-- Line items -->
        <table class="items">
            <thead>
                <tr>
                    <th style="width:4%">#</th>
                    <th style="width:30%">Description</th>
                    <th style="width:11%">HSN/SAC</th>
                    <th style="width:7%" class="text-center">Qty</th>
                    <th style="width:12%" class="text-right">Rate</th>
                    <th style="width:12%" class="text-right">Taxable</th>
                    <th style="width:10%" class="text-right">CGST</th>
                    <th style="width:10%" class="text-right">SGST</th>
                    <th style="width:14%" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${lineItems.map((item, index) => {
                  const rate = item.tax_rate || 0;
                  const taxAmount = item.tax_amount || 0;
                  const taxableValue = (item.line_total || 0) - taxAmount;
                  const { cgstRate, sgstRate, cgstAmount, sgstAmount } = splitGst(taxAmount, rate);
                  return `
                <tr>
                    <td>${index + 1}</td>
                    <td class="desc">
                        ${esc(item.description)}
                        ${item.item_date ? `<div class="sub">${esc(new Date(item.item_date).toLocaleDateString('en-IN'))}</div>` : ''}
                    </td>
                    <td class="num">${esc(getHsnSac(item.item_type, item.description))}</td>
                    <td class="text-center num">${esc(item.quantity)}</td>
                    <td class="text-right num">${fc(item.unit_price)}</td>
                    <td class="text-right num">${fc(taxableValue)}</td>
                    <td class="text-right num">${rate > 0 ? `${fc(cgstAmount)}<div class="rate-sub">${cgstRate}%</div>` : '—'}</td>
                    <td class="text-right num">${rate > 0 ? `${fc(sgstAmount)}<div class="rate-sub">${sgstRate}%</div>` : '—'}</td>
                    <td class="text-right num strong">${fc(item.line_total)}</td>
                </tr>
                  `;
                }).join('')}
            </tbody>
        </table>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-left">
                ${Object.keys(gstBreakdown).length > 0 ? `
                <div class="uplabel">GST Summary</div>
                <table class="gst-table">
                    <thead>
                        <tr><th>Rate</th><th>Taxable</th><th>CGST</th><th>SGST</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(gstBreakdown).map(([rate, b]) => {
                          const { cgstAmount, sgstAmount } = splitGst(b.tax_amount, parseFloat(rate));
                          return `
                        <tr>
                            <td>${esc(rate)}%</td>
                            <td class="num">${fc(b.taxable_amount)}</td>
                            <td class="num">${fc(cgstAmount)}</td>
                            <td class="num">${fc(sgstAmount)}</td>
                        </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                ` : ''}
            </div>
            <div class="summary-right">
                <table class="totals">
                    <tr>
                        <td class="t-label">Taxable Value</td>
                        <td class="t-val num">${fc(totalTaxable)}</td>
                    </tr>
                    ${invoice.total_discount > 0 ? `
                    <tr class="discount">
                        <td class="t-label">Discount</td>
                        <td class="t-val num">-${fc(invoice.total_discount)}</td>
                    </tr>` : ''}
                    ${totalTax > 0 ? `
                    <tr>
                        <td class="t-label">CGST</td>
                        <td class="t-val num">${fc(totalCgst)}</td>
                    </tr>
                    <tr>
                        <td class="t-label">SGST</td>
                        <td class="t-val num">${fc(totalSgst)}</td>
                    </tr>` : ''}
                    <tr class="grand">
                        <td class="t-label">Grand Total</td>
                        <td class="t-val num">${fc(invoice.total_amount)}</td>
                    </tr>
                    ${invoice.paid_amount > 0 ? `
                    <tr>
                        <td class="t-label">Paid</td>
                        <td class="t-val num">${fc(invoice.paid_amount)}</td>
                    </tr>
                    <tr>
                        <td class="t-label">Balance Due</td>
                        <td class="t-val num">${fc(invoice.balance_amount)}</td>
                    </tr>` : ''}
                </table>
            </div>
        </div>

        <!-- Amount in words -->
        <div class="words"><span class="strong">Amount in Words:</span> ${esc(totalInWords)}</div>

        ${showBank ? `
        <div class="block">
            <div class="uplabel">Bank Details</div>
            <div class="bank-grid">
                ${invoiceData.bank_name ? `<div>Bank: ${esc(invoiceData.bank_name)}</div>` : ''}
                ${invoiceData.bank_account_number ? `<div>A/c: ${esc(invoiceData.bank_account_number)}</div>` : ''}
                ${invoiceData.bank_account_holder_name ? `<div>Holder: ${esc(invoiceData.bank_account_holder_name)}</div>` : ''}
                ${invoiceData.bank_ifsc_code ? `<div>IFSC: ${esc(invoiceData.bank_ifsc_code)}</div>` : ''}
                ${invoiceData.bank_branch ? `<div>Branch: ${esc(invoiceData.bank_branch)}</div>` : ''}
            </div>
        </div>` : ''}

        ${options.include_payments && invoice.payments && invoice.payments.length > 0 ? `
        <div class="block">
            <div class="uplabel">Payment History</div>
            <table class="pay-table">
                <thead>
                    <tr>
                        <th>Date</th><th>Method</th><th>Reference</th>
                        <th class="text-right">Amount</th><th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.payments.map(payment => `
                    <tr>
                        <td>${esc(new Date(payment.payment_date).toLocaleDateString('en-IN'))}</td>
                        <td>${esc((payment.payment_method || '').replace('_', ' ').toUpperCase())}</td>
                        <td>${esc(payment.reference_number || '-')}</td>
                        <td class="text-right num">${fc(payment.amount)}</td>
                        <td>${esc(payment.notes || '-')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>` : ''}

        ${options.include_terms && invoice.terms_and_conditions ? `
        <div class="block">
            <div class="uplabel">Terms &amp; Conditions</div>
            <div class="terms-content">${esc(invoice.terms_and_conditions)}</div>
        </div>` : ''}

        ${invoice.notes ? `
        <div class="block">
            <div class="uplabel">Notes</div>
            <div class="terms-content">${esc(invoice.notes)}</div>
        </div>` : ''}

        <div class="footer">
            <div>Thank you for your business.</div>
            <div>This is a computer-generated invoice and does not require a signature.</div>
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
        top: '14mm',
        right: '12mm',
        bottom: '14mm',
        left: '12mm',
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
