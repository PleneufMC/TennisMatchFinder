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

module.exports = nextConfig;
