import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Client Supabase avec le Service Role Key
 * À utiliser UNIQUEMENT côté serveur pour les opérations admin
 * 
 * ⚠️ ATTENTION: Ce client bypass le RLS (Row Level Security)
 * Ne JAMAIS exposer côté client
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables for admin client'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Crée un nouveau joueur après inscription via auth
 * Utilisé par le webhook post-signup ou la route d'inscription
 */
export async function createPlayerProfile(
  userId: string,
  email: string,
  fullName: string,
  clubId: string,
  options?: {
    avatarUrl?: string;
    selfAssessedLevel?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  }
) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('players')
    .insert({
      id: userId,
      email,
      full_name: fullName,
      club_id: clubId,
      avatar_url: options?.avatarUrl,
      self_assessed_level: options?.selfAssessedLevel || 'intermédiaire',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating player profile:', error);
    throw error;
  }

  return data;
}

/**
 * Crée une notification pour un utilisateur
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  options?: {
    link?: string;
    data?: Record<string, unknown>;
  }
) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link: options?.link,
      data: options?.data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return data;
}

/**
 * Attribue un badge à un joueur
 */
export async function awardBadge(
  playerId: string,
  badgeType: string,
  badgeName: string,
  badgeDescription: string,
  badgeIcon?: string
) {
  const adminClient = createAdminClient();

  // Vérifie si le joueur a déjà ce badge
  const { data: existing } = await adminClient
    .from('player_badges')
    .select('id')
    .eq('player_id', playerId)
    .eq('badge_type', badgeType)
    .single();

  if (existing) {
    return existing; // Badge déjà attribué
  }

  const { data, error } = await adminClient
    .from('player_badges')
    .insert({
      player_id: playerId,
      badge_type: badgeType,
      badge_name: badgeName,
      badge_description: badgeDescription,
      badge_icon: badgeIcon,
    })
    .select()
    .single();

  if (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }

  // Créer une notification pour le joueur
  await createNotification(
    playerId,
    'badge_earned',
    '🏆 Nouveau badge obtenu !',
    `Félicitations ! Vous avez obtenu le badge "${badgeName}"`,
    {
      link: '/profil',
      data: { badgeType, badgeName },
    }
  );

  return data;
}

/**
 * Applique le decay d'inactivité à tous les joueurs inactifs
 * À appeler via un cron job
 */
export async function applyInactivityDecay() {
  const adminClient = createAdminClient();
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  // Récupère tous les joueurs inactifs depuis 3+ semaines
  const { data: inactivePlayers, error: fetchError } = await adminClient
    .from('players')
    .select('id, current_elo, club_id, clubs(settings)')
    .lt('last_match_at', threeWeeksAgo.toISOString())
    .gt('current_elo', 1000); // Ne pas descendre en dessous de 1000

  if (fetchError) {
    console.error('Error fetching inactive players:', fetchError);
    throw fetchError;
  }

  if (!inactivePlayers || inactivePlayers.length === 0) {
    return { processed: 0 };
  }

  let processed = 0;

  for (const player of inactivePlayers) {
    // Récupérer le decay configuré pour le club
    const settings = (player.clubs as { settings?: { inactivityDecay?: { decayPerWeek?: number } } })?.settings;
    const decayPerWeek = settings?.inactivityDecay?.decayPerWeek ?? 2;

    const newElo = Math.max(1000, player.current_elo - decayPerWeek);
    const delta = newElo - player.current_elo;

    // Mettre à jour l'ELO
    await adminClient
      .from('players')
      .update({ current_elo: newElo })
      .eq('id', player.id);

    // Enregistrer dans l'historique
    await adminClient.from('elo_history').insert({
      player_id: player.id,
      elo: newElo,
      delta,
      reason: 'inactivity_decay',
      details: { weeks_inactive: 3, decay_applied: decayPerWeek },
    });

    processed++;
  }

  return { processed };
}
