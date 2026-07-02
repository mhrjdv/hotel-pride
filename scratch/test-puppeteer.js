const puppeteer = require('puppeteer');

async function test() {
  try {
    console.log('Attempting to launch puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('Browser launched successfully');
    const page = await browser.newPage();
    await page.setContent('<h1>Test PDF</h1>');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF generated successfully, size:', pdf.length);
    await browser.close();
    console.log('Browser closed successfully');
  } catch (err) {
    console.error('Error running puppeteer test:', err);
  }
}

test();
