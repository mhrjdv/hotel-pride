import { test, expect } from './helpers';
import { navTo } from './helpers';
import { tagName } from './cleanup';

test.describe('Customers', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navTo(page, /^customers$/i);
    await expect(page.getByRole('heading', { name: /^customers$/i })).toBeVisible();
  });

  test('list shows the seeded customers', async ({ authedPage: page }) => {
    // Both mobile-card and desktop-table layouts exist in the DOM; one is hidden
    // by CSS at any viewport, so scope to the visible instance.
    await expect(page.getByText('Rajesh Kumar').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('Priya Sharma').filter({ visible: true }).first()).toBeVisible();
  });

  test('search updates the query string and keeps matching results visible', async ({ authedPage: page }) => {
    const search = page.getByPlaceholder(/search customers/i);
    await search.fill('Rajesh');
    await search.press('Enter');
    await expect(page).toHaveURL(/search=Rajesh/);
    await expect(page.getByText('Rajesh Kumar').filter({ visible: true }).first()).toBeVisible();
  });

  test('an unknown search term shows the empty state', async ({ authedPage: page }) => {
    // Real PostgREST supports `.or(name.ilike/phone.ilike/email.ilike)` (see
    // src/app/(dashboard)/customers/page.tsx), so a guaranteed-no-match term now
    // filters server-side down to zero rows and renders the empty state.
    const noMatch = 'zzz-no-such-customer-9999';
    const search = page.getByPlaceholder(/search customers/i);
    await search.fill(noMatch);
    await search.press('Enter');

    await expect(page).toHaveURL(new RegExp(`search=${noMatch}`));
    await expect(page.getByRole('heading', { name: /no customers found/i })).toBeVisible();
    await expect(page.getByText(/try adjusting your search filters/i)).toBeVisible();
  });

  test('add-customer form validates required fields', async ({ authedPage: page }) => {
    // The "Add New Customer" trigger is overlapped by the search/filter row at
    // the 390px viewport (see fixme below), so this form-logic test runs on desktop.
    const vp = page.viewportSize();
    test.skip(!!vp && vp.width < 640, 'header controls overlap on mobile');

    await page.getByRole('button', { name: /add new customer/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /add new customer/i })).toBeVisible();

    // Submit empty -> zod validation messages appear.
    await dialog.getByRole('button', { name: /^add customer$/i }).click();
    await expect(dialog.getByText(/name must be at least 2 characters/i)).toBeVisible();
    await expect(dialog.getByText(/phone number must be in \+91/i)).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('adding a valid customer succeeds', async ({ authedPage: page }) => {
    const vp = page.viewportSize();
    test.skip(!!vp && vp.width < 640, 'header controls overlap on mobile');

    // Tagged name so the global teardown deletes this customer (name LIKE 'E2ETEST%').
    const name = tagName();
    const unique = Date.now().toString().slice(-6);

    // The empty state (rendered when the real DB has no customers) ALSO contains
    // an "Add New Customer" button, so two can exist — scope to the header one
    // (first in DOM order).
    await page.getByRole('button', { name: /add new customer/i }).first().click();
    const dialog = page.getByRole('dialog');

    await dialog.getByLabel(/full name/i).fill(name);
    await dialog.getByLabel(/phone number/i).fill('+919800000000');
    // NOTE: email must be supplied — the form omits empty optional fields from the
    // request body, and the API's zod schema rejects a missing email (see fixme
    // "adding a customer with a blank email" below).
    await dialog.getByLabel(/email address/i).fill(`guest${unique}@example.com`);
    await dialog.getByLabel(/id number/i).fill('ABCDE1234F');
    await dialog.getByLabel(/address line 1/i).fill('12 Test Street, Block A');
    await dialog.getByLabel(/^city/i).fill('Pune');
    await dialog.getByLabel(/^state/i).fill('Maharashtra');
    await dialog.getByLabel(/pin code/i).fill('411001');

    await dialog.getByRole('button', { name: /^add customer$/i }).click();

    // On success a toast is shown and the dialog closes.
    await expect(page.getByText(/customer added successfully/i)).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('adding a customer with a blank email succeeds', async ({ authedPage: page }) => {
    // Regression: a blank optional email used to fail with HTTP 400. The API
    // schema now accepts null/'' and the form sends empty strings.
    const vp = page.viewportSize();
    test.skip(!!vp && vp.width < 640, 'header controls overlap on mobile');

    // Tagged name so the global teardown deletes this customer (name LIKE 'E2ETEST%').
    const name = tagName('no-email');

    // Empty state may also render an "Add New Customer" button; scope to header.
    await page.getByRole('button', { name: /add new customer/i }).first().click();
    const dialog = page.getByRole('dialog');

    await dialog.getByLabel(/full name/i).fill(name);
    await dialog.getByLabel(/phone number/i).fill('+919811111111');
    // Email intentionally left blank.
    await dialog.getByLabel(/id number/i).fill('ABCDE1234F');
    await dialog.getByLabel(/address line 1/i).fill('34 No Email Lane, Block B');
    await dialog.getByLabel(/^city/i).fill('Nashik');
    await dialog.getByLabel(/^state/i).fill('Maharashtra');
    await dialog.getByLabel(/pin code/i).fill('422001');

    await dialog.getByRole('button', { name: /^add customer$/i }).click();

    await expect(page.getByText(/customer added successfully/i)).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  // SUSPECTED BUG (mobile layout): at 390px the Customers header packs the search
  // input, type selector, Search button, Filters dropdown AND "Add New Customer"
  // into one non-wrapping flex row (src/app/(dashboard)/customers/page.tsx +
  // CustomerSearch.tsx), so the Add button is overlapped and not clickable. Fix by
  // letting the row wrap / stacking on small screens.
  test.fixme('add-customer is reachable on a 390px viewport', async () => {});

  test('opening a customer profile shows their details and booking history', async ({ authedPage: page }) => {
    // Seeded customer c1 = Rajesh Kumar. Profile is reached at /customers/:id.
    await page.goto('/customers/c1');
    await expect(page.getByRole('heading', { name: /rajesh kumar/i })).toBeVisible();
    await expect(page.getByText(/total bookings/i).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /booking history/i })).toBeVisible();
  });

  test('customer invoices API returns a list for a known customer', async ({ authedPage: page }) => {
    // The customer profile has no invoices tab in the UI; the data is served by
    // an API route. Assert it responds successfully for the seeded customer.
    const res = await page.request.get('/api/customers/c1/invoices');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeTruthy();
  });
});
