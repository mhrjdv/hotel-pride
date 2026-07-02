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

  console.log('Fetching users from auth...');
  const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) {
    console.error('Error fetching auth users:', uErr);
  } else {
    console.log('Auth Users count:', users.length);
    users.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Created At: ${u.created_at}`));
  }

  console.log('\nFetching profiles...');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) {
    console.error('Error fetching profiles:', pErr);
  } else {
    console.log('Profiles:', profiles);
  }
}

run();
