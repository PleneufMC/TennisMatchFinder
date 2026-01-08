import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://tennismatchfinder.net';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Pages d'authentification (sauf login/register)
          '/api/',
          
          // Pages protégées / dashboard
          '/dashboard/',
          '/profil/',
          '/settings/',
          '/admin/',
          '/matchs/',
          '/suggestions/',
          '/chat/',
          '/classement/',
          '/achievements/',
          '/rivalite/',
          '/match-now/',
          '/box-leagues/',
          '/tournaments/',
          '/help/',
          
          // Pages système
          '/_next/',
          '/static/',
          
          // Paramètres de recherche
          '/*?*',
        ],
      },
      {
        // Googlebot - accès complet aux pages publiques
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/login',
          '/register',
          '/pricing',
          '/terms',
          '/privacy',
          '/mentions-legales',
          '/cookies',
          '/clubs/',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/profil/',
          '/settings/',
          '/admin/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
