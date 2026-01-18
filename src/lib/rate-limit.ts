/**
 * Rate Limiting avec Upstash Redis (serverless-compatible)
 * Fallback en mémoire pour le développement local
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// Types pour la configuration
export interface RateLimitConfig {
  /** Nombre de requêtes autorisées */
  requests: number;
  /** Fenêtre de temps en secondes */
  window: number;
  /** Identifiant pour le namespace du rate limiter */
  identifier: string;
}

// Configurations prédéfinies par type de route
export const RATE_LIMIT_CONFIGS = {
  // Auth routes - strictes pour éviter le bruteforce
  auth: {
    requests: 5,
    window: 60, // 5 requêtes par minute
    identifier: 'auth',
  },
  // Login spécifiquement - très strict
  login: {
    requests: 3,
    window: 60, // 3 tentatives par minute
    identifier: 'login',
  },
  // Registration
  register: {
    requests: 3,
    window: 300, // 3 inscriptions par 5 minutes
    identifier: 'register',
  },
  // API générale
  api: {
    requests: 60,
    window: 60, // 60 requêtes par minute
    identifier: 'api',
  },
  // Matches - modéré
  matches: {
    requests: 30,
    window: 60, // 30 requêtes par minute
    identifier: 'matches',
  },
  // Stripe/Paiement - strict
  stripe: {
    requests: 10,
    window: 60, // 10 requêtes par minute
    identifier: 'stripe',
  },
  // Upload - très limité
  upload: {
    requests: 5,
    window: 60, // 5 uploads par minute
    identifier: 'upload',
  },
  // Chat - plus permissif
  chat: {
    requests: 100,
    window: 60, // 100 messages par minute
    identifier: 'chat',
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

// Store en mémoire pour le fallback (dev local)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiter en mémoire (fallback)
 */
function memoryRateLimiter(
  key: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const windowMs = config.window * 1000;
  const entry = memoryStore.get(key);

  // Nettoyer les entrées expirées périodiquement
  if (Math.random() < 0.01) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt < now) {
        memoryStore.delete(k);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // Nouvelle fenêtre
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: config.requests - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  if (entry.count >= config.requests) {
    // Rate limit atteint
    return {
      success: false,
      remaining: 0,
      reset: Math.ceil(entry.resetAt / 1000),
    };
  }

  // Incrémenter le compteur
  entry.count++;
  return {
    success: true,
    remaining: config.requests - entry.count,
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

/**
 * Créer un rate limiter Upstash (si configuré)
 */
function createUpstashRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return null;
  }

  try {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${config.window}s`),
      analytics: true,
      prefix: `ratelimit:${config.identifier}`,
    });
  } catch (error) {
    console.error('[RateLimit] Failed to create Upstash rate limiter:', error);
    return null;
  }
}

// Cache des rate limiters Upstash
const upstashLimiters = new Map<string, Ratelimit | null>();

/**
 * Obtenir l'identifiant unique pour le rate limiting
 */
export function getRateLimitIdentifier(request: NextRequest): string {
  // Priorité : User ID > IP > Fallback
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'anonymous';
  
  return ip;
}

/**
 * Appliquer le rate limiting
 */
export async function rateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}> {
  const config = RATE_LIMIT_CONFIGS[type];
  const identifier = getRateLimitIdentifier(request);
  const key = `${config.identifier}:${identifier}`;

  let result: { success: boolean; remaining: number; reset: number };

  // Essayer Upstash d'abord
  if (!upstashLimiters.has(type)) {
    upstashLimiters.set(type, createUpstashRateLimiter(config));
  }

  const upstashLimiter = upstashLimiters.get(type);

  if (upstashLimiter) {
    try {
      const upstashResult = await upstashLimiter.limit(identifier);
      result = {
        success: upstashResult.success,
        remaining: upstashResult.remaining,
        reset: Math.ceil(upstashResult.reset / 1000),
      };
    } catch (error) {
      console.error('[RateLimit] Upstash error, falling back to memory:', error);
      result = memoryRateLimiter(key, config);
    }
  } else {
    // Fallback mémoire
    result = memoryRateLimiter(key, config);
  }

  // Headers standard pour le rate limiting
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.requests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success) {
    headers['Retry-After'] = Math.max(0, result.reset - Math.floor(Date.now() / 1000)).toString();
  }

  return { ...result, headers };
}

/**
 * Middleware helper pour appliquer le rate limiting dans les routes API
 */
export async function withRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<Response | null> {
  const result = await rateLimit(request, type);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: result.headers['Retry-After'],
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...result.headers,
        },
      }
    );
  }

  return null; // Pas de rate limit, continuer
}

/**
 * Ajouter les headers de rate limit à une réponse existante
 */
export function addRateLimitHeaders(
  response: Response,
  headers: Record<string, string>
): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(headers)) {
    newHeaders.set(key, value);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
