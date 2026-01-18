import { withSentryConfig } from '@sentry/nextjs';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development', // Désactiver en dev pour éviter les problèmes de cache
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisation des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers de sécurité supplémentaires (complétés par netlify.toml)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Service Worker headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  // Redirections
  async redirects() {
    return [
      // Redirection ancienne route vers nouvelle si nécessaire
    ];
  },

  // Configuration expérimentale
  experimental: {
    // Optimisation du Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Configuration pour le mode strict React
  reactStrictMode: true,

  // Optimisation du bundle
  swcMinify: true,

  // Logging en production
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  
  // Upload source maps to Sentry (requires SENTRY_AUTH_TOKEN)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production
  dryRun: process.env.NODE_ENV !== 'production' || !process.env.SENTRY_AUTH_TOKEN,
};

// Sentry Next.js SDK options
const sentryOptions = {
  // Automatically instrument Next.js
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
  
  // Tunnel route for bypassing ad blockers (optional)
  // tunnelRoute: '/monitoring-tunnel',
  
  // Hide source maps from browser
  hideSourceMaps: true,
  
  // Disable Sentry CLI during build if no auth token
  disableLogger: true,
  
  // Skip build if Sentry is not configured
  skipBuildCheck: true,
};

// Apply both Serwist and Sentry
const configWithSerwist = withSerwist(nextConfig);

// Wrap with Sentry only if DSN is configured
const finalConfig = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  ? withSentryConfig(configWithSerwist, sentryWebpackPluginOptions, sentryOptions)
  : configWithSerwist;

export default finalConfig;
