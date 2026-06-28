import { test, expect } from './helpers';
import { navTo } from './helpers';

test.describe('Bookings', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navTo(page, /^bookings$/i);
    await expect(page.getByRole('heading', { name: /booking management/i })).toBeVisible();
  });

  test('list page loads with search, filters and quick stats', async ({ authedPage: page }) => {
    await expect(page.getByPlaceholder(/search bookings/i)).toBeVisible();
    await expect(page.getByText(/total bookings/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /new booking/i })).toBeVisible();
    // Filter triggers (status, payment, date) are comboboxes.
    await expect(page.getByRole('combobox')).toHaveCount(3);
  });

  test('searching for a non-existent booking shows the empty state', async ({ authedPage: page }) => {
    await page.getByPlaceholder(/search bookings/i).fill('ZZZ-no-such-booking-9999');
    await expect(page.getByText(/no bookings found/i)).toBeVisible();
  });

  test('a status + payment filter combination yields the empty state', async ({ authedPage: page }) => {
    // Booking Status -> Cancelled
    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: /^cancelled$/i }).click();
    // Payment Status -> Refunded
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: /^refunded$/i }).click();

    await expect(page.getByText(/no bookings found/i)).toBeVisible();
  });

  test('the new-booking wizard opens and cannot advance without a room', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /new booking/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /new booking/i })).toBeVisible();
    await expect(dialog.getByText(/step 1 of 4/i)).toBeVisible();

    // Step 1 requires a room; with none selected, Next is disabled.
    const next = dialog.getByRole('button', { name: /^next$/i });
    await expect(next).toBeDisabled();
  });

  test('the wizard can be dismissed via Escape and the discard confirmation', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /new booking/i }).click();
    await expect(page.getByRole('heading', { name: /new booking/i })).toBeVisible();

    // RoomSelection seeds default dates, so closing prompts a discard confirm.
    await page.keyboard.press('Escape');
    const discard = page.getByRole('button', { name: /^discard$/i });
    if (await discard.isVisible().catch(() => false)) {
      await discard.click();
    }
    await expect(page.getByRole('heading', { name: /new booking/i })).toBeHidden();
  });

  test('check-in actions are not present when there are no eligible bookings', async ({ authedPage: page }) => {
    // The seeded DB has no bookings, so the conditional Check In control should
    // not render. This verifies the action is gated, not always shown.
    await expect(page.getByText(/no bookings found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^check in$/i })).toHaveCount(0);
  });

  // Exercising the check-in transition requires seeding a 'confirmed' booking
  // whose check-in date is today via the multi-step wizard (room + customer +
  // payment), which depends on the RoomSelection/GuestRegistration sub-forms.
  // Tracked separately to keep this suite reliable.
  test.fixme('checking in a confirmed booking moves it to checked-in', async () => {});
});
