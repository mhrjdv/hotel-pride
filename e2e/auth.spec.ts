import { test, expect } from '@playwright/test';
import { login, MOCK_USER } from './helpers';

test.describe('Authentication', () => {
  test('valid login lands on the dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$|\/$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('missing email keeps the user on the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Native required validation on the email field blocks submit.
    await expect(page).toHaveURL(/\/login/);
    const emailValid = await page
      .getByLabel(/email/i)
      .evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValid).toBe(false);
  });

  test('missing password keeps the user on the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(MOCK_USER.email);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    const passwordValid = await page
      .getByLabel(/password/i)
      .evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(passwordValid).toBe(false);
  });

  test('invalid email format is rejected by the field', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    const emailValid = await page
      .getByLabel(/email/i)
      .evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValid).toBe(false);
  });

  test('password visibility toggle reveals and hides the password', async ({ page }) => {
    await page.goto('/login');
    const password = page.getByLabel(/password/i);
    await password.fill('secret123');
    await expect(password).toHaveAttribute('type', 'password');

    // The toggle is the icon button inside the password field group.
    const toggle = page.locator('button[type="button"]').first();
    await toggle.click();
    await expect(password).toHaveAttribute('type', 'text');
    await toggle.click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('protected route redirects to login with redirectTo when logged out', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/bookings');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fbookings/);
  });

  test('redirects to the requested page after logging in', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/customers');
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/email/i).fill(MOCK_USER.email);
    await page.getByLabel(/password/i).fill(MOCK_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/customers/);
    await expect(page.getByRole('heading', { name: /^customers$/i })).toBeVisible();
  });

  test('logout returns the user to the login page', async ({ page }) => {
    await login(page);

    // The account dropdown trigger is the avatar button (last button in header).
    await page.locator('header button').last().click();
    await page.getByRole('menuitem', { name: /log ?out/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting login while authenticated bounces to the dashboard', async ({ page }) => {
    await login(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/$/);
  });
});
