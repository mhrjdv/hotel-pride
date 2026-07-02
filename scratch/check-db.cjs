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

  // Query invoices and their line items
  const { data: invoices, error: iErr } = await supabase.from('invoices').select('id, invoice_number, customer_name, subtotal, total_tax, total_amount').limit(1);
  if (iErr) {
    console.error('Error fetching invoices:', iErr);
  } else {
    console.log('Invoices:', invoices);
    if (invoices.length > 0) {
      const { data: items, error: itErr } = await supabase.from('invoice_line_items').select('*').eq('invoice_id', invoices[0].id);
      if (itErr) {
        console.error('Error fetching line items:', itErr);
      } else {
        console.log('Line Items for first invoice:');
        console.log(JSON.stringify(items, null, 2));
      }
    }
  }
}

run();
