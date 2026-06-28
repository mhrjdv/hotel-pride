import { test, expect } from './helpers';
import { navTo } from './helpers';

test.describe('Reports', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navTo(page, /^reports$/i);
    await expect(page.getByRole('heading', { name: /reports & analytics/i })).toBeVisible();
  });

  test('loads with the analytics stat cards', async ({ authedPage: page }) => {
    // Tab labels are icon-only on mobile, so assert on the rendered card text
    // (which exists once the loading spinner clears) rather than tab names.
    await expect(page.getByText(/total revenue/i).first()).toBeVisible();
    await expect(page.getByText(/occupancy rate/i).first()).toBeVisible();
    await expect(page.getByText(/pending dues/i).first()).toBeVisible();
  });

  test('the period filter changes the active range label', async ({ authedPage: page }) => {
    const periodSelect = page.getByRole('combobox').first();
    await periodSelect.click();
    await page.getByRole('option', { name: /this year/i }).click();
    // The period label propagates into the cards/sections.
    await expect(page.getByText(new RegExp(`${new Date().getFullYear()}`)).first()).toBeVisible();
  });

  test('shows empty-data states when there are no bookings/invoices', async ({ authedPage: page }) => {
    // A fresh mock DB has no bookings or invoices, so empty placeholders render.
    await expect(page.getByText(/no revenue data for this period|no bookings in this period/i).first())
      .toBeVisible();
  });
});
