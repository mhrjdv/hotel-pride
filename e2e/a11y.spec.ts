import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './helpers';
import { navTo } from './helpers';
import type { Page } from '@playwright/test';

/**
 * Two serious/critical axe rules currently fail across the whole app and are
 * real UI bugs to be fixed in the refactor phase (documented as fixme tests
 * below). We exclude them here so the page-level scans still gate any *new*
 * serious/critical regression rather than being permanently red.
 */
const KNOWN_FAILING_RULES = ['button-name', 'color-contrast'];

async function seriousViolations(page: Page, { disableKnown = true } = {}) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  if (disableKnown) builder = builder.disableRules(KNOWN_FAILING_RULES);
  const results = await builder.analyze();
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

test.describe('Accessibility (axe) — gating scans', () => {
  test('login page has no other serious/critical violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    const violations = await seriousViolations(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  const pages: { label: RegExp; heading: RegExp }[] = [
    { label: /^dashboard$/i, heading: /welcome back/i },
    { label: /^rooms$/i, heading: /room management/i },
    { label: /^bookings$/i, heading: /booking management/i },
    { label: /^customers$/i, heading: /^customers$/i },
    { label: /^invoices$/i, heading: /invoice management/i },
    { label: /^reports$/i, heading: /reports & analytics/i },
    { label: /^settings$/i, heading: /hotel settings/i },
  ];

  for (const { label, heading } of pages) {
    test(`${label.source} has no other serious/critical violations`, async ({ authedPage: page }) => {
      await navTo(page, label);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      const violations = await seriousViolations(page);
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});

test.describe('Accessibility (axe) — known real bugs', () => {
  // SUSPECTED BUG: many icon-only buttons (password toggle on /login, the header
  // avatar/notifications buttons, room card "Details", booking/invoice row action
  // icons) have no accessible name -> axe rule "button-name" (critical). Fix by
  // adding aria-label / sr-only text to icon-only buttons.
  test.fixme('login page has no button-name violations', async ({ page }) => {
    await page.goto('/login');
    const v = await seriousViolations(page, { disableKnown: false });
    expect(v.filter((x) => x.id === 'button-name')).toEqual([]);
  });

  // SUSPECTED BUG: several text/badge color combinations fail WCAG AA contrast
  // (axe rule "color-contrast", serious) — e.g. muted gray helper text and some
  // colored badges. Fix by darkening foregrounds / adjusting badge palettes.
  test.fixme('dashboard has no color-contrast violations', async ({ authedPage: page }) => {
    const v = await seriousViolations(page, { disableKnown: false });
    expect(v.filter((x) => x.id === 'color-contrast')).toEqual([]);
  });
});

test.describe('Accessibility (basic checks)', () => {
  test('icon-only header buttons that DO have names expose them', async ({ authedPage: page }) => {
    await expect(page.getByRole('button', { name: /notifications/i })).toBeVisible();
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 640) {
      await expect(page.getByRole('button', { name: /toggle menu/i })).toBeVisible();
    }
  });

  test('the booking dialog responds to Escape', async ({ authedPage: page }) => {
    await navTo(page, /^bookings$/i);
    await page.getByRole('button', { name: /new booking/i }).click();
    await expect(page.getByRole('heading', { name: /new booking/i })).toBeVisible();
    await page.keyboard.press('Escape');
    // Escape either closes the wizard or raises the discard confirmation; either
    // way a dismissal path is offered and focus left the form.
    const discard = page.getByRole('button', { name: /^discard$/i });
    const wizardHeading = page.getByRole('heading', { name: /new booking/i });
    await expect(async () => {
      const confirming = await discard.isVisible().catch(() => false);
      const closed = await wizardHeading.isHidden().catch(() => false);
      expect(confirming || closed).toBe(true);
    }).toPass();
    if (await discard.isVisible().catch(() => false)) {
      await discard.click();
    }
  });
});
