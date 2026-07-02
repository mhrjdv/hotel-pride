async function check() {
  try {
    const puppeteer = await import('puppeteer');
    console.log('puppeteer imported keys:', Object.keys(puppeteer));
    console.log('puppeteer.default keys:', puppeteer.default ? Object.keys(puppeteer.default) : 'undefined');
    console.log('puppeteer.launch:', typeof puppeteer.launch);
    console.log('puppeteer.default.launch:', puppeteer.default ? typeof puppeteer.default.launch : 'undefined');
  } catch (err) {
    console.error('Import error:', err);
  }
}
check();
