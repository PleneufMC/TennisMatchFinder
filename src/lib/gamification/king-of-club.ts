/**
 * King of Club - Badge Dynamique
 * 
 * Ce badge est spécial car il est DYNAMIQUE :
 * - Attribué automatiquement au joueur #1 ELO du club
 * - Retiré si quelqu'un le dépasse
 * - Notification au nouveau et ancien King
 * 
 * USP : Engagement communautaire et fierté du #1
 */

import { db } from '@/lib/db';
import { players, playerBadges, notifications, clubs } from '@/lib/db/schema';
import { eq, and, desc, ne, sql } from 'drizzle-orm';
import { getBadgeById, type Badge } from './badges';

const KING_OF_CLUB_BADGE_ID = 'king_of_club';

interface KingOfClubResult {
  newKingId: string | null;
  previousKingId: string | null;
  changed: boolean;
}

/**
 * Récupère le joueur #1 ELO d'un club
 */
export async function getClubTopPlayer(clubId: string): Promise<{
  id: string;
  fullName: string;
  currentElo: number;
} | null> {
  const topPlayers = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      currentElo: players.currentElo,
    })
    .from(players)
    .where(
      and(
        eq(players.clubId, clubId),
        eq(players.isActive, true)
      )
    )
    .orderBy(desc(players.currentElo))
    .limit(1);

  return topPlayers[0] || null;
}

/**
 * Récupère le King actuel d'un club (celui qui a le badge)
 */
export async function getCurrentKing(clubId: string): Promise<string | null> {
  // Récupérer tous les joueurs du club qui ont le badge King of Club
  const kingsWithBadge = await db
    .select({
      playerId: playerBadges.playerId,
    })
    .from(playerBadges)
    .innerJoin(players, eq(playerBadges.playerId, players.id))
    .where(
      and(
        eq(playerBadges.badgeType, KING_OF_CLUB_BADGE_ID),
        eq(players.clubId, clubId),
        eq(players.isActive, true)
      )
    );

  return kingsWithBadge[0]?.playerId || null;
}

/**
 * Attribue le badge King of Club à un joueur
 */
async function awardKingBadge(playerId: string): Promise<void> {
  const badge = getBadgeById(KING_OF_CLUB_BADGE_ID);
  if (!badge) return;

  // Vérifier si le joueur a déjà le badge
  const existingBadge = await db
    .select()
    .from(playerBadges)
    .where(
      and(
        eq(playerBadges.playerId, playerId),
        eq(playerBadges.badgeType, KING_OF_CLUB_BADGE_ID)
      )
    )
    .limit(1);

  if (existingBadge.length > 0) return;

  // Attribuer le badge
  await db.insert(playerBadges).values({
    playerId,
    badgeType: badge.id,
    badgeName: badge.name,
    badgeDescription: badge.description,
    badgeIcon: badge.icon,
    earnedAt: new Date(),
  });
}

/**
 * Retire le badge King of Club d'un joueur
 */
async function revokeKingBadge(playerId: string): Promise<void> {
  await db
    .delete(playerBadges)
    .where(
      and(
        eq(playerBadges.playerId, playerId),
        eq(playerBadges.badgeType, KING_OF_CLUB_BADGE_ID)
      )
    );
}

/**
 * Envoie une notification au nouveau King
 */
async function notifyNewKing(playerId: string, clubName: string): Promise<void> {
  await db.insert(notifications).values({
    userId: playerId,
    type: 'king_of_club',
    title: '👑 Tu es le nouveau King of Club !',
    message: `Félicitations ! Tu es désormais le joueur #1 ELO de ${clubName}. Défends ta couronne !`,
    link: '/classement',
    data: {
      badgeId: KING_OF_CLUB_BADGE_ID,
      event: 'crowned',
    },
  });
}

/**
 * Envoie une notification à l'ancien King
 */
async function notifyDethroned(playerId: string, newKingName: string, clubName: string): Promise<void> {
  await db.insert(notifications).values({
    userId: playerId,
    type: 'king_of_club',
    title: '⚔️ Tu as perdu ta couronne !',
    message: `${newKingName} t'a dépassé au classement de ${clubName}. Reconquiers ta place de King !`,
    link: '/classement',
    data: {
      badgeId: KING_OF_CLUB_BADGE_ID,
      event: 'dethroned',
      newKingName,
    },
  });
}

/**
 * Met à jour le King of Club pour un club donné
 * À appeler après chaque match dans ce club
 */
export async function updateKingOfClub(clubId: string): Promise<KingOfClubResult> {
  const result: KingOfClubResult = {
    newKingId: null,
    previousKingId: null,
    changed: false,
  };

  // Récupérer les infos du club
  const [club] = await db
    .select({ name: clubs.name })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);

  if (!club) return result;

  // Récupérer le joueur #1 actuel
  const topPlayer = await getClubTopPlayer(clubId);
  if (!topPlayer) return result;

  result.newKingId = topPlayer.id;

  // Récupérer le King actuel (celui avec le badge)
  const currentKingId = await getCurrentKing(clubId);
  result.previousKingId = currentKingId;

  // Si le top player n'est pas le King actuel, changer
  if (topPlayer.id !== currentKingId) {
    result.changed = true;

    // Retirer le badge de l'ancien King
    if (currentKingId) {
      await revokeKingBadge(currentKingId);
      await notifyDethroned(currentKingId, topPlayer.fullName, club.name);
    }

    // Attribuer le badge au nouveau King
    await awardKingBadge(topPlayer.id);
    await notifyNewKing(topPlayer.id, club.name);
  }

  return result;
}

/**
 * Vérifie et met à jour le King of Club pour tous les clubs
 * À appeler dans un cron job quotidien
 */
export async function updateAllKingsOfClub(): Promise<void> {
  // Récupérer tous les clubs actifs
  const activeClubs = await db
    .select({ id: clubs.id })
    .from(clubs)
    .where(eq(clubs.isActive, true));

  for (const club of activeClubs) {
    try {
      await updateKingOfClub(club.id);
    } catch (error) {
      console.error(`Failed to update King of Club for club ${club.id}:`, error);
    }
  }
}

/**
 * Récupère les infos du King d'un club pour affichage
 */
export async function getKingOfClubInfo(clubId: string): Promise<{
  kingId: string;
  kingName: string;
  kingElo: number;
  kingAvatar: string | null;
  reignSince: Date;
} | null> {
  const kingBadge = await db
    .select({
      kingId: playerBadges.playerId,
      kingName: players.fullName,
      kingElo: players.currentElo,
      kingAvatar: players.avatarUrl,
      reignSince: playerBadges.earnedAt,
    })
    .from(playerBadges)
    .innerJoin(players, eq(playerBadges.playerId, players.id))
    .where(
      and(
        eq(playerBadges.badgeType, KING_OF_CLUB_BADGE_ID),
        eq(players.clubId, clubId),
        eq(players.isActive, true)
      )
    )
    .limit(1);

  return kingBadge[0] || null;
}
