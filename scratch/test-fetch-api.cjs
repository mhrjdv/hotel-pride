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
  
  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@hotelpride.com',
    password: 'HotelPride@2026',
  });
  
  if (authError) {
    console.error('Sign in error:', authError);
    return;
  }
  
  const token = authData.session.access_token;
  const projectRef = 'brbamjgcryowykwgfrya'; // Extracted from cookies 'sb-brbamjgcryowykwgfrya-auth-token'
  
  const invoiceId = 'fb643346-860a-499d-96ed-c4ffcbf62252';
  console.log('Fetching PDF for active invoice:', invoiceId);
  
  const response = await fetch(`http://localhost:3000/api/invoices/${invoiceId}/pdf`);
  
  console.log('Response Status:', response.status);
  console.log('Content-Type:', response.headers.get('content-type'));
  console.log('Content-Disposition:', response.headers.get('content-disposition'));
  
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log('Received Buffer length:', buffer.length);
  console.log('First 20 bytes (Hex):', buffer.slice(0, 20).toString('hex'));
  console.log('First 20 bytes (ASCII):', buffer.slice(0, 20).toString('utf-8'));
  
  fs.writeFileSync('scratch/test-fb.pdf', buffer);
}

run().catch(console.error);
