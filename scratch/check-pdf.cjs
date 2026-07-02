const fs = require('fs');

const content = fs.readFileSync('scratch/test-direct.pdf');
console.log('Total file length (with headers):', content.length);

// Split headers and body
const doubleNewlineIndex = content.indexOf('\r\n\r\n');
if (doubleNewlineIndex === -1) {
  console.log('No HTTP headers separator found');
} else {
  const headers = content.slice(0, doubleNewlineIndex).toString('utf-8');
  console.log('--- HEADERS ---');
  console.log(headers);
  console.log('----------------');
  
  const body = content.slice(doubleNewlineIndex + 4);
  console.log('Body length:', body.length);
  console.log('First 20 bytes of body (Hex):', body.slice(0, 20).toString('hex'));
  console.log('First 20 bytes of body (ASCII):', body.slice(0, 20).toString('utf-8'));
}
