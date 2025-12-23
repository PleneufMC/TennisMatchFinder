import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/database';

/**
 * Type pour le profil joueur avec son club
 */
export type PlayerProfileData = Tables<'players'> & {
  clubs: Tables<'clubs'>;
};

/**
 * Crée un client Supabase pour le serveur (Server Components, Server Actions, Route Handlers)
 * Gère automatiquement les cookies pour la session
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Le set peut échouer dans un Server Component (read-only)
            // C'est normal, le middleware gérera le cookie
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Idem que set
          }
        },
      },
    }
  );
}

/**
 * Récupère l'utilisateur authentifié côté serveur
 * Retourne null si non authentifié
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Récupère la session complète côté serveur
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

/**
 * Récupère le profil joueur de l'utilisateur connecté
 */
export async function getPlayerProfile(): Promise<PlayerProfileData | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: player, error } = await supabase
    .from('players')
    .select('*, clubs(*)')
    .eq('id', user.id)
    .single();

  if (error || !player) {
    return null;
  }

  return player as PlayerProfileData;
}
