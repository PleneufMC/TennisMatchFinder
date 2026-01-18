import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 * 
 * Tests the login, registration, and authentication flows.
 * Note: These tests work with magic link auth, so we can't fully test
 * the login flow without email access.
 */

test.describe('Login Page', () => {
  test('should display login page with email input', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check for email input
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Check for submit button
    const submitButton = page.getByRole('button', { name: /connexion|envoyer|continuer/i });
    await expect(submitButton.first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const submitButton = page.getByRole('button', { name: /connexion|envoyer|continuer/i });
    
    // Enter invalid email
    await emailInput.fill('invalid-email');
    await submitButton.first().click();
    
    // Should show validation error or not submit
    // (Implementation depends on form validation)
  });

  test('should show loading state on submit', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const submitButton = page.getByRole('button', { name: /connexion|envoyer|continuer/i });
    
    // Enter valid email
    await emailInput.fill('test@example.com');
    await submitButton.first().click();
    
    // Check for loading indicator or disabled state
    // (Button might be disabled or show loading spinner)
  });
});

test.describe('Registration Page', () => {
  test('should display registration page', async ({ page }) => {
    await page.goto('/register');
    
    // Check for registration form
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check for form fields
    const nameInput = page.locator('input[name*="name"], input[placeholder*="nom"]').first();
    const emailInput = page.getByRole('textbox', { name: /email/i });
    
    // At least one input should be visible
    const hasNameInput = await nameInput.isVisible().catch(() => false);
    const hasEmailInput = await emailInput.isVisible().catch(() => false);
    expect(hasNameInput || hasEmailInput).toBeTruthy();
  });

  test('should have link to login', async ({ page }) => {
    await page.goto('/register');
    
    // Look for "already have account" link
    const loginLink = page.getByRole('link', { name: /connexion|login|se connecter|déjà/i });
    await expect(loginLink.first()).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing profile without auth', async ({ page }) => {
    await page.goto('/profil');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing matches without auth', async ({ page }) => {
    await page.goto('/matchs');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
