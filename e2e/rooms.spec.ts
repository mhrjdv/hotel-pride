import { test, expect } from './helpers';
import { navTo } from './helpers';

test.describe('Rooms', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navTo(page, /^rooms$/i);
    await expect(page.getByRole('heading', { name: /room management/i })).toBeVisible();
  });

  test('loads the room grid with seeded rooms', async ({ authedPage: page }) => {
    // Seed data contains rooms A201..V402.
    await expect(page.getByText('Room A201')).toBeVisible();
    await expect(page.getByText('Room V402')).toBeVisible();
    // Each room card exposes a Details action.
    await expect(page.getByRole('button', { name: /details/i }).first()).toBeVisible();
  });

  test('room cards show status and rate information', async ({ authedPage: page }) => {
    const firstCard = page
      .getByText('Room A201')
      .locator('xpath=ancestor::*[@data-slot="card"][1]');
    await expect(firstCard).toContainText(/₹/);
    await expect(firstCard.getByText(/max \d+ guests/i)).toBeVisible();
  });

  // The current Rooms page renders read-only status cards: there is no status
  // filter UI and RoomCard is not given an onSelect handler, so available rooms
  // expose no "Select Room"/booking action and occupied rooms expose no action
  // either. These journeys live on the booking wizard instead (see bookings.spec).
  test.fixme(
    'status filters narrow the room list',
    async () => {
      // SUSPECTED GAP: /rooms (src/app/(dashboard)/rooms/page.tsx + RoomGrid.tsx)
      // has no status filter controls. Add filter buttons/tabs before enabling.
    }
  );

  test.fixme(
    'an available room can start a booking; an occupied room cannot',
    async () => {
      // SUSPECTED GAP: RoomCard's booking action only renders when an `onSelect`
      // prop is passed, which the Rooms page never does. There is therefore no
      // "Select Room" / start-booking button on this page for any room.
    }
  );
});
