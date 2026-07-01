import { test, expect } from './helpers';
import { navTo } from './helpers';
import * as path from 'node:path';
import * as fs from 'node:fs';

test.describe('GST Reports', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navTo(page, /^reports$/i);
    await expect(page.getByRole('heading', { name: /reports & analytics/i })).toBeVisible();
    
    // Switch to GST tab (5th tab in the list, index 4)
    await page.locator('[data-slot="tabs-trigger"]').nth(4).click();
  });

  test('loads the GST Sales Register summary cards and table ledger', async ({ authedPage: page }) => {
    await expect(page.getByText(/taxable value \(base\)/i).first()).toBeVisible();
    await expect(page.getByText(/cgst collected/i).first()).toBeVisible();
    await expect(page.getByText(/sgst collected/i).first()).toBeVisible();
    await expect(page.getByText(/total gst collected/i).first()).toBeVisible();
    
    await expect(page.getByText('Transactions Ledger').first()).toBeVisible();
  });

  test('allows exporting the GST report as a CSV file', async ({ authedPage: page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export gst csv/i }).click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('gst-register');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('allows importing a GST CSV and renders reconciliation data', async ({ authedPage: page }) => {
    // Generate a temporary mock CSV file to upload
    const tempDir = path.resolve(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const csvPath = path.join(tempDir, 'reconcile-test.csv');
    fs.writeFileSync(
      csvPath,
      'Reference Number,Guest Name,Total Amount,GST Amount\n' +
      'SMPL-0011,Aarav Mehta,3472,372\n' +
      'BK-NONEXISTENT,John Doe,1000,120\n'
    );

    // Set up file chooser intercept and upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/select csv file/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(csvPath);

    // Verify reconciliation preview renders the uploaded rows
    await expect(page.getByText(/all imported/i)).toBeVisible();
    await expect(page.getByText('SMPL-0011')).toBeVisible();
    await expect(page.getByText('BK-NONEXISTENT')).toBeVisible();

    // Verify reconciliation statuses: Matched / Mismatch / Not in DB
    await expect(page.getByText('Matched').first()).toBeVisible();
    await expect(page.getByText('Not in DB').first()).toBeVisible();

    // Clean up temp file
    try {
      fs.unlinkSync(csvPath);
    } catch {}
  });
});
