import { test, expect } from './helpers';
import { navTo } from './helpers';

test.describe('Dashboard', () => {
  test('loads with a welcome heading after login', async ({ authedPage: page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('shows the summary stat cards', async ({ authedPage: page }) => {
    for (const card of [/total rooms/i, /today's revenue/i, /check-ins today/i, /pending payments/i]) {
      await expect(page.getByText(card).first()).toBeVisible();
    }
    // Total Rooms reflects the 18 seeded rooms.
    await expect(page.getByText('18').first()).toBeVisible();
  });

  test('nav links route to the core sections', async ({ authedPage: page }) => {
    const sections: [RegExp, RegExp][] = [
      [/^rooms$/i, /room management/i],
      [/^bookings$/i, /booking management/i],
      [/^customers$/i, /^customers$/i],
      [/^invoices$/i, /invoice management/i],
      [/^reports$/i, /reports & analytics/i],
      [/^settings$/i, /hotel settings/i],
    ];
    for (const [link, heading] of sections) {
      await navTo(page, link);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      await navTo(page, /^dashboard$/i);
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    }
  });

  test('mobile nav opens and closes', async ({ authedPage: page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width >= 640, 'mobile-only behaviour');

    // Closed state: the dark overlay behind the drawer is not rendered.
    const overlay = page.locator('div.fixed.inset-0.bg-black');
    await expect(overlay).toHaveCount(0);

    const toggle = page.getByRole('button', { name: /toggle menu/i });
    await toggle.click();

    // Open state: overlay is present and a nav link in the drawer is reachable.
    await expect(overlay).toBeVisible();
    await expect(page.getByRole('link', { name: /^rooms$/i })).toBeVisible();

    // Tap the close (X) button inside the drawer; the overlay is then removed.
    const drawer = page.locator('aside').filter({ visible: true });
    await drawer.getByRole('button').first().click();
    await expect(overlay).toHaveCount(0);
  });
});
