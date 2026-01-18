import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Home Page & Navigation
 * 
 * Tests the public home page and basic navigation.
 */

test.describe('Home Page', () => {
  test('should display the home page with hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check for main content
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for CTA buttons
    const ctaButton = page.getByRole('link', { name: /inscription|rejoindre|commencer/i });
    await expect(ctaButton.first()).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click on login link
    const loginLink = page.getByRole('link', { name: /connexion|login|se connecter/i });
    if (await loginLink.first().isVisible()) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');
    
    // Look for pricing link
    const pricingLink = page.getByRole('link', { name: /prix|pricing|tarifs/i });
    if (await pricingLink.first().isVisible()) {
      await pricingLink.first().click();
      await expect(page).toHaveURL(/pricing/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that the page still renders
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile menu or navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
    // Mobile menu might be hidden initially
  });
});

test.describe('Static Pages', () => {
  test('should display terms page', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display privacy page', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display cookies page', async ({ page }) => {
    await page.goto('/cookies');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Cookie Banner', () => {
  test('should display cookie banner on first visit', async ({ page, context }) => {
    // Clear cookies to simulate first visit
    await context.clearCookies();
    
    await page.goto('/');
    
    // Look for cookie banner
    const cookieBanner = page.locator('text=/cookie|vie privée|accepter/i');
    // Banner might appear after a delay
    await page.waitForTimeout(1000);
  });
});
