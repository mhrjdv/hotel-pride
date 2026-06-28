import { test, expect } from './helpers';
import { navTo } from './helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navTo(page, /^settings$/i);
    await expect(page.getByRole('heading', { name: /hotel settings/i })).toBeVisible();
  });

  test('loads the current hotel configuration', async ({ authedPage: page }) => {
    // Seeded config: Hotel Pride. The basic-info tab is the default.
    await expect(page.getByLabel(/hotel name/i)).toHaveValue(/hotel pride/i);
    await expect(page.getByLabel(/gst number/i)).toHaveValue(/27AAAAA1111A1Z1/i);
  });

  test('editing and saving shows a success message', async ({ authedPage: page }) => {
    const name = page.getByLabel(/hotel name/i);
    await name.fill('Hotel Pride (Edited)');

    await page.getByRole('button', { name: /save configuration/i }).click();
    await expect(page.getByText(/configuration saved successfully/i)).toBeVisible();

    // Restore the original value to keep the shared mock DB tidy.
    await name.fill('Hotel Pride');
    await page.getByRole('button', { name: /save configuration/i }).click();
    await expect(page.getByText(/configuration saved successfully/i)).toBeVisible();
  });

  test('switching tabs reveals bank and system settings', async ({ authedPage: page }) => {
    await page.getByRole('tab', { name: /bank details/i }).click();
    await expect(page.getByLabel(/bank name/i)).toBeVisible();

    await page.getByRole('tab', { name: /system settings/i }).click();
    await expect(page.getByLabel(/default gst rate/i)).toBeVisible();
  });

  // The settings form performs no client- or server-side validation on the GST
  // number, PIN code, phone or email format — any value is accepted and saved.
  // Enable once format validation is added to HotelSettingsClient / the config API.
  test.fixme('rejects an invalid GST / PIN / phone / email', async () => {
    // SUSPECTED GAP: src/app/(dashboard)/settings/HotelSettingsClient.tsx +
    // src/app/api/hotel/config/route.ts (PUT) accept malformed values silently.
  });
});
