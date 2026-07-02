import { test, expect } from './helpers';
import { navTo } from './helpers';

test.describe('Rooms', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navTo(page, /^rooms$/i);
    await expect(page.getByRole('heading', { name: /room management/i })).toBeVisible();
  });

  test('loads the room grid with seeded rooms', async ({ authedPage: page }) => {
    // Seed data contains rooms like 101, 201, 204.
    await expect(page.getByRole('cell', { name: '101' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: '201' }).first()).toBeVisible();
    
    // Each room row exposes an Edit action.
    await expect(page.getByRole('button', { name: /edit room 101/i })).toBeVisible();
  });

  test('room rows show status and rate information', async ({ authedPage: page }) => {
    const row = page.getByRole('row', { name: /101/ });
    await expect(row).toContainText(/₹/);
    await expect(row).toContainText(/double bed deluxe/i);
  });
});
