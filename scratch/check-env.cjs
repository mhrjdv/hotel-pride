const fs = require('fs');
const path = require('path');

function checkEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const keys = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      keys.push(trimmed.slice(0, eq).trim());
    }
    console.log('Available Env Keys:', keys);
  } else {
    console.log('.env.local not found');
  }
}

checkEnv();
