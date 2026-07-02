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

  // Fetch invoice
  const id = 'de608478-43eb-44c4-9c49-9e0208de3361';
  console.log('Fetching invoice:', id);
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
    console.error('Error fetching invoice:', error);
    return;
  }

  console.log('Invoice fetched successfully. Generating PDF...');
  
  // Call generateInvoicePDF (compiled version or source version)
  // Let's import the compiled version of generateInvoicePDF from the build
  // since that's what the server runs!
  // Wait, let's just require the source file by registering tsx or compiling
  // Or we can write a tiny script using dynamic import since node supports it.
  try {
    const { generateInvoicePDF } = await import('../src/lib/utils/pdf-generator.js');
    const pdfBuffer = await generateInvoicePDF(invoice, {
      format: 'A4',
      orientation: 'portrait',
      include_payments: true,
      include_terms: true,
    });
    
    console.log('PDF Buffer length:', pdfBuffer.length);
    console.log('First 20 bytes (Hex):', pdfBuffer.slice(0, 20).toString('hex'));
    console.log('First 20 bytes (ASCII):', pdfBuffer.slice(0, 20).toString('utf-8'));
    
    fs.writeFileSync('scratch/test-actual.pdf', pdfBuffer);
    console.log('Wrote scratch/test-actual.pdf');
  } catch (err) {
    console.error('Error generating PDF in script:', err);
  }
}

run();
