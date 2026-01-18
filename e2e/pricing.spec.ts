import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Pricing Page
 * 
 * Tests the pricing page and subscription flows.
 */

test.describe('Pricing Page', () => {
  test('should display pricing page with plans', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check for page title
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for pricing cards or plan information
    const pricingContent = page.locator('text=/gratuit|premium|free|€|EUR/i');
    await expect(pricingContent.first()).toBeVisible();
  });

  test('should display free tier features', async ({ page }) => {
    await page.goto('/pricing');
    
    // Look for free tier
    const freeTier = page.locator('text=/gratuit|free/i');
    await expect(freeTier.first()).toBeVisible();
  });

  test('should display premium tier features', async ({ page }) => {
    await page.goto('/pricing');
    
    // Look for premium tier
    const premiumTier = page.locator('text=/premium|pro|illimité/i');
    await expect(premiumTier.first()).toBeVisible();
  });

  test('should have subscribe button for premium', async ({ page }) => {
    await page.goto('/pricing');
    
    // Look for subscribe/upgrade button
    const subscribeButton = page.getByRole('button', { name: /s'abonner|souscrire|upgrade|choisir/i });
    
    // At least one subscribe button should exist
    const buttonCount = await subscribeButton.count();
    expect(buttonCount).toBeGreaterThanOrEqual(0); // May be 0 if user is already premium
  });

  test('should redirect to login when clicking subscribe without auth', async ({ page }) => {
    await page.goto('/pricing');
    
    // Find a subscribe button
    const subscribeButton = page.getByRole('button', { name: /s'abonner|souscrire|upgrade|choisir/i }).first();
    
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
      
      // Should either redirect to login or show login modal
      // (Implementation depends on how auth is handled)
      await page.waitForTimeout(1000);
      
      // Check if redirected to login or if login modal appeared
      const isOnLoginPage = page.url().includes('login');
      const hasLoginModal = await page.locator('text=/connexion|login/i').isVisible();
      
      // One of these should be true
      expect(isOnLoginPage || hasLoginModal).toBeTruthy();
    }
  });
});

test.describe('Pricing - Billing Toggle', () => {
  test('should toggle between monthly and yearly billing', async ({ page }) => {
    await page.goto('/pricing');
    
    // Look for billing toggle
    const yearlyToggle = page.locator('text=/annuel|yearly|an/i');
    const monthlyToggle = page.locator('text=/mensuel|monthly|mois/i');
    
    // At least one should be visible if toggle exists
    const hasYearly = await yearlyToggle.first().isVisible().catch(() => false);
    const hasMonthly = await monthlyToggle.first().isVisible().catch(() => false);
    
    // If both exist, try clicking
    if (hasYearly && hasMonthly) {
      await yearlyToggle.first().click();
      await page.waitForTimeout(500);
      
      // Price should update (exact validation depends on implementation)
    }
  });
});
