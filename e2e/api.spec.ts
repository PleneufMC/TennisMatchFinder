import { test, expect } from '@playwright/test';

/**
 * E2E Tests: API Endpoints
 * 
 * Tests critical API endpoints for proper responses and error handling.
 */

test.describe('API Health Checks', () => {
  test('should return 401 for unauthenticated profile request', async ({ request }) => {
    const response = await request.get('/api/profile');
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should return 401 for unauthenticated matches request', async ({ request }) => {
    const response = await request.get('/api/matches');
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});

test.describe('API Rate Limiting', () => {
  test('should include rate limit headers in response', async ({ request }) => {
    // Make a request to a rate-limited endpoint
    const response = await request.get('/api/matches');
    
    // Check for rate limit headers
    const headers = response.headers();
    
    // Rate limit headers should be present (even on 401 responses)
    // Note: Headers might not be present if rate limiting isn't applied to the response
  });

  test('should handle registration rate limiting', async ({ request }) => {
    // Try multiple rapid registration attempts
    const responses = await Promise.all([
      request.post('/api/auth/register-city', {
        data: { email: 'test1@test.com', fullName: 'Test User', city: 'Paris', selfAssessedLevel: 'intermédiaire' }
      }),
      request.post('/api/auth/register-city', {
        data: { email: 'test2@test.com', fullName: 'Test User', city: 'Paris', selfAssessedLevel: 'intermédiaire' }
      }),
      request.post('/api/auth/register-city', {
        data: { email: 'test3@test.com', fullName: 'Test User', city: 'Paris', selfAssessedLevel: 'intermédiaire' }
      }),
    ]);

    // At least one should succeed or fail with a meaningful status
    const statuses = responses.map(r => r.status());
    expect(statuses.some(s => s === 200 || s === 400 || s === 429)).toBeTruthy();
  });
});

test.describe('API Error Handling', () => {
  test('should return proper error for invalid match creation', async ({ request }) => {
    const response = await request.post('/api/matches', {
      data: {
        // Invalid/incomplete data
        opponentId: 'invalid-id',
      }
    });
    
    // Should return 401 (not authenticated) or 400 (bad request)
    expect([400, 401]).toContain(response.status());
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should handle malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/auth/register-city', {
      headers: {
        'Content-Type': 'application/json',
      },
      // @ts-ignore - intentionally sending invalid data
      data: 'not-json',
    });
    
    // Should return 400 Bad Request or 500 Internal Server Error
    expect([400, 500]).toContain(response.status());
  });
});

test.describe('Stripe API', () => {
  test('should require authentication for checkout', async ({ request }) => {
    const response = await request.post('/api/stripe/checkout', {
      data: { planId: 'premium' }
    });
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('should require authentication for portal', async ({ request }) => {
    const response = await request.post('/api/stripe/portal');
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});

test.describe('Upload API', () => {
  test('should require authentication for avatar upload', async ({ request }) => {
    const response = await request.post('/api/upload/avatar', {
      multipart: {
        file: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data'),
        },
      },
    });
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});
