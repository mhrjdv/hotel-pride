import { test as base, expect, type Page } from '@playwright/test';

/**
 * Shared test helpers for the Hotel Pride E2E suite.
 *
 * Auth model (real Supabase): the app uses a real `@supabase/ssr` client backed
 * by the production Supabase project. A dedicated admin account exists for tests
 * (see ADMIN_USER). `LoginForm` calls `signInWithPassword` and, on success, does
 * a full-page navigation via `window.location.assign('/')`, after which the
 * dashboard renders the "Welcome back, Hotel Admin!" heading. A realistic login
 * is therefore: fill `#email` + `#password`, submit, and wait for `/` + heading.
 */

/** Real admin credentials seeded for E2E (role=admin). */
export const ADMIN_USER = {
  email: 'admin@hotelpride.com',
  password: 'HotelPride@2026',
};

/**
 * Back-compat alias. Several specs import `MOCK_USER` for "fill a plausible
 * email/password" cases (e.g. native-validation tests). It now points at the
 * real admin account so those flows authenticate against the real backend.
 */
export const MOCK_USER = ADMIN_USER;

/** Log in through the real login form and wait for the dashboard to render. */
export async function login(page: Page, redirectTo?: string): Promise<void> {
  const target = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login';
  await page.goto(target);

  // The login form inputs are `#email` and `#password` (LoginForm.tsx). Playwright's
  // fill() dispatches real React events, so the controlled inputs update correctly.
  await page.locator('#email').fill(ADMIN_USER.email);
  await page.locator('#password').fill(ADMIN_USER.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  if (!redirectTo || redirectTo === '/') {
    // LoginForm does window.location.assign('/') — a full navigation to the dashboard.
    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  } else {
    await page.waitForURL((url) => !url.pathname.startsWith('/login'));
  }
}

/**
 * Open the mobile sidebar (hamburger) if we're on a narrow viewport. On desktop
 * the nav links are always visible, so this is a no-op there.
 */
export async function openNav(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 640;
  if (isMobile) {
    const toggle = page.getByRole('button', { name: /toggle menu/i });
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
    }
  }
}

/** Click a primary nav link by its visible label, opening the mobile menu first. */
export async function navTo(page: Page, label: RegExp | string): Promise<void> {
  await openNav(page);
  const name = typeof label === 'string' ? new RegExp(`^${label}$`, 'i') : label;
  await page.getByRole('link', { name }).click();
}

/** A `test` fixture that is already logged in and sitting on the dashboard. */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await login(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };
