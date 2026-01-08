import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { clubs, forumThreads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'https://tennismatchfinder.net';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques publiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Pages dynamiques - Clubs publics
  let clubPages: MetadataRoute.Sitemap = [];
  try {
    const allClubs = await db
      .select({
        slug: clubs.slug,
        updatedAt: clubs.updatedAt,
      })
      .from(clubs);

    clubPages = allClubs.map((club) => ({
      url: `${BASE_URL}/clubs/${club.slug}`,
      lastModified: club.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des clubs pour le sitemap:', error);
  }

  // Pages dynamiques - Fils de forum publics (si applicable)
  let forumPages: MetadataRoute.Sitemap = [];
  try {
    const publicThreads = await db
      .select({
        id: forumThreads.id,
        updatedAt: forumThreads.updatedAt,
      })
      .from(forumThreads)
      .limit(100); // Limiter pour les performances

    forumPages = publicThreads.map((thread) => ({
      url: `${BASE_URL}/forum/${thread.id}`,
      lastModified: thread.updatedAt || new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des threads pour le sitemap:', error);
  }

  return [...staticPages, ...clubPages, ...forumPages];
}
