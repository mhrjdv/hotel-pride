const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

async function run() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing URL or service key');
    return;
  }
  const supabase = createClient(url, key);

  // Fetch invoice by number
  const num = 'INV-2026-5426';
  console.log('Searching for invoice:', num);
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      line_items:invoice_line_items(*),
      payments:invoice_payments(*),
      customer:customers(id, name, email, phone),
      booking:bookings(id, booking_number, check_in_date, check_out_date)
    `)
    .eq('invoice_number', num);

  if (error) {
    console.error('Error fetching invoice:', error);
    return;
  }

  console.log('Found invoices:', invoices.length);
  if (invoices.length > 0) {
    const invoice = invoices[0];
    console.log('Invoice ID:', invoice.id);
    console.log('Customer name:', invoice.customer ? invoice.customer.name : 'null');
    console.log('Line items count:', invoice.line_items.length);
    
    // Attempt PDF generation for this specific invoice
    try {
      const { generateInvoicePDF } = await import('../src/lib/utils/pdf-generator.js');
      const pdfBuffer = await generateInvoicePDF(invoice, {
        format: 'A4',
        orientation: 'portrait',
        include_payments: true,
        include_terms: true,
      });
      console.log('PDF Generated for this invoice! Length:', pdfBuffer.length);
      console.log('Is PDF Binary:', pdfBuffer.slice(0, 4).toString('utf-8') === '%PDF');
    } catch (pdfErr) {
      console.error('PDF Generation failed for this specific invoice:', pdfErr);
    }
  }
}

run();
