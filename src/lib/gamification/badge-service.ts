/**
 * Service d'attribution automatique des badges
 * 
 * Ce service vérifie les conditions d'obtention des badges
 * et les attribue automatiquement aux joueurs.
 */

import { db } from '@/lib/db';
import { players, playerBadges, matches, eloHistory, notifications } from '@/lib/db/schema';
import { eq, and, gte, desc, sql, ne, count } from 'drizzle-orm';
import { BADGES, type Badge, RARITY_LABELS } from './badges';

// Date limite Early Bird
const EARLY_BIRD_DEADLINE = new Date('2026-06-30T23:59:59');

// ============================================
// TYPES
// ============================================

export interface PlayerStats {
  playerId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  currentElo: number;
  bestElo: number;
  winStreak: number;
  bestWinStreak: number;
  uniqueOpponents: number;
  createdAt: Date;
}

export interface BadgeCheckResult {
  badge: Badge;
  earned: boolean;
  alreadyHas: boolean;
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Vérifie et attribue tous les badges éligibles pour un joueur
 * @returns Les badges nouvellement attribués
 */
export async function checkAndAwardBadges(playerId: string): Promise<Badge[]> {
  const stats = await getPlayerStats(playerId);
  if (!stats) return [];

  const existingBadges = await getPlayerBadges(playerId);
  const existingBadgeIds = new Set(existingBadges.map((b) => b.badgeType));

  const newBadges: Badge[] = [];

  for (const badge of BADGES) {
    // Skip si déjà obtenu
    if (existingBadgeIds.has(badge.id)) continue;

    // Vérifier la condition
    const earned = await checkBadgeCondition(badge, stats, playerId);

    if (earned) {
      // Attribuer le badge
      await awardBadge(playerId, badge);
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Récupère les badges d'un joueur
 */
export async function getPlayerBadges(playerId: string) {
  return db
    .select()
    .from(playerBadges)
    .where(eq(playerBadges.playerId, playerId))
    .orderBy(desc(playerBadges.earnedAt));
}

/**
 * Attribue un badge à un joueur
 */
export async function awardBadge(playerId: string, badge: Badge): Promise<void> {
  await db.insert(playerBadges).values({
    playerId,
    badgeType: badge.id,
    badgeName: badge.name,
    badgeDescription: badge.description,
    badgeIcon: badge.icon,
    earnedAt: new Date(),
  });

  // Créer une notification pour le joueur
  await createBadgeNotification(playerId, badge);
}

/**
 * Crée une notification pour un badge nouvellement obtenu
 */
async function createBadgeNotification(playerId: string, badge: Badge): Promise<void> {
  const rarityLabel = RARITY_LABELS[badge.rarity] || badge.rarity;
  
  await db.insert(notifications).values({
    userId: playerId,
    type: 'badge_earned',
    title: `Nouveau badge : ${badge.name}`,
    message: `Félicitations ! Vous avez débloqué le badge "${badge.name}" (${rarityLabel}). ${badge.description}`,
    link: '/achievements',
    data: {
      badgeId: badge.id,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      badgeRarity: badge.rarity,
      badgeCategory: badge.category,
    },
  });
}

/**
 * Vérifie si un joueur a un badge spécifique
 */
export async function playerHasBadge(playerId: string, badgeId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(playerBadges)
    .where(and(eq(playerBadges.playerId, playerId), eq(playerBadges.badgeType, badgeId)))
    .limit(1);

  return result.length > 0;
}

// ============================================
// RÉCUPÉRATION DES STATS
// ============================================

/**
 * Récupère les statistiques complètes d'un joueur
 */
export async function getPlayerStats(playerId: string): Promise<PlayerStats | null> {
  const player = await db
    .select({
      id: players.id,
      matchesPlayed: players.matchesPlayed,
      wins: players.wins,
      losses: players.losses,
      currentElo: players.currentElo,
      bestElo: players.bestElo,
      winStreak: players.winStreak,
      bestWinStreak: players.bestWinStreak,
      uniqueOpponents: players.uniqueOpponents,
      createdAt: players.createdAt,
    })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player[0]) return null;

  return {
    playerId,
    matchesPlayed: player[0].matchesPlayed,
    wins: player[0].wins,
    losses: player[0].losses,
    currentElo: player[0].currentElo,
    bestElo: player[0].bestElo,
    winStreak: player[0].winStreak,
    bestWinStreak: player[0].bestWinStreak,
    uniqueOpponents: player[0].uniqueOpponents,
    createdAt: player[0].createdAt,
  };
}

// ============================================
// VÉRIFICATION DES CONDITIONS
// ============================================

/**
 * Vérifie si un joueur remplit la condition d'un badge
 */
async function checkBadgeCondition(
  badge: Badge,
  stats: PlayerStats,
  playerId: string
): Promise<boolean> {
  switch (badge.id) {
    // --- JALONS ---
    case 'first_match':
      return stats.matchesPlayed >= 1;

    case 'match_10':
      return stats.matchesPlayed >= 10;

    case 'match_50':
      return stats.matchesPlayed >= 50;

    case 'match_100':
      return stats.matchesPlayed >= 100;

    case 'elo_1400':
      return stats.currentElo >= 1400 || stats.bestElo >= 1400;

    // --- EXPLOITS ---
    case 'giant_slayer':
      return await checkGiantSlayer(playerId);

    case 'win_streak_5':
      return stats.winStreak >= 5 || stats.bestWinStreak >= 5;

    case 'win_streak_10':
      return stats.winStreak >= 10 || stats.bestWinStreak >= 10;

    case 'perfect_month':
      return await checkPerfectMonth(playerId);

    case 'comeback_king':
      return await checkComebackKing(playerId);

    // --- SOCIAL ---
    case 'social_butterfly':
      return stats.uniqueOpponents >= 10;

    case 'networking_pro':
      return stats.uniqueOpponents >= 25;

    case 'club_legend':
      return stats.uniqueOpponents >= 50;

    // --- SPÉCIAL ---
    case 'early_bird':
      return stats.createdAt <= EARLY_BIRD_DEADLINE;

    case 'king_of_club':
      return await checkKingOfClub(playerId);

    case 'club_regular':
      return await checkClubRegular(playerId);

    default:
      return false;
  }
}

// ============================================
// VÉRIFICATIONS SPÉCIALES
// ============================================

/**
 * Vérifie si le joueur a battu quelqu'un avec +200 ELO
 */
async function checkGiantSlayer(playerId: string): Promise<boolean> {
  const result = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(matches)
    .where(
      and(
        eq(matches.winnerId, playerId),
        sql`(
          (${matches.player1Id} = ${playerId} AND ${matches.player2EloBefore} - ${matches.player1EloBefore} >= 200)
          OR
          (${matches.player2Id} = ${playerId} AND ${matches.player1EloBefore} - ${matches.player2EloBefore} >= 200)
        )`
      )
    );

  return (result[0]?.count ?? 0) > 0;
}

/**
 * Vérifie si le joueur a eu un mois parfait (100% victoires, min 4 matchs)
 */
async function checkPerfectMonth(playerId: string): Promise<boolean> {
  // Récupérer les matchs des 12 derniers mois groupés par mois
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const playerMatches = await db
    .select({
      playedAt: matches.playedAt,
      winnerId: matches.winnerId,
    })
    .from(matches)
    .where(
      and(
        gte(matches.playedAt, oneYearAgo),
        sql`(${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId})`
      )
    )
    .orderBy(matches.playedAt);

  // Grouper par mois
  const monthlyStats = new Map<string, { total: number; wins: number }>();

  for (const match of playerMatches) {
    const monthKey = `${match.playedAt.getFullYear()}-${match.playedAt.getMonth()}`;
    const current = monthlyStats.get(monthKey) || { total: 0, wins: 0 };
    current.total++;
    if (match.winnerId === playerId) current.wins++;
    monthlyStats.set(monthKey, current);
  }

  // Vérifier si un mois est parfait
  for (const stats of monthlyStats.values()) {
    if (stats.total >= 4 && stats.wins === stats.total) {
      return true;
    }
  }

  return false;
}

/**
 * Vérifie si le joueur a remonté 100+ ELO en 30 jours
 */
async function checkComebackKing(playerId: string): Promise<boolean> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Récupérer l'historique ELO des 30 derniers jours
  const history = await db
    .select({
      elo: eloHistory.elo,
      recordedAt: eloHistory.recordedAt,
    })
    .from(eloHistory)
    .where(
      and(eq(eloHistory.playerId, playerId), gte(eloHistory.recordedAt, thirtyDaysAgo))
    )
    .orderBy(eloHistory.recordedAt);

  if (history.length < 2) return false;

  // Trouver le point le plus bas et vérifier la remontée
  const firstEntry = history[0];
  if (!firstEntry) return false;
  
  let minElo = firstEntry.elo;
  let minEloIndex = 0;

  for (let i = 1; i < history.length; i++) {
    const entry = history[i];
    if (entry && entry.elo < minElo) {
      minElo = entry.elo;
      minEloIndex = i;
    }
  }

  // Vérifier si on a remonté 100+ depuis le minimum
  for (let i = minEloIndex + 1; i < history.length; i++) {
    const entry = history[i];
    if (entry && entry.elo - minElo >= 100) {
      return true;
    }
  }

  return false;
}

/**
 * Vérifie si le joueur est #1 du classement de son club
 */
async function checkKingOfClub(playerId: string): Promise<boolean> {
  // Récupérer le club du joueur
  const player = await db
    .select({ clubId: players.clubId, currentElo: players.currentElo })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player[0] || !player[0].clubId) return false;

  // Compter les joueurs avec un ELO supérieur dans le même club
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .where(
      and(
        eq(players.clubId, player[0].clubId),
        sql`${players.currentElo} > ${player[0].currentElo}`,
        eq(players.isActive, true)
      )
    );

  // Si personne n'a un ELO supérieur, le joueur est #1
  return (result[0]?.count ?? 0) === 0;
}

/**
 * Vérifie si le joueur est le plus actif du club sur les 90 derniers jours
 */
async function checkClubRegular(playerId: string): Promise<boolean> {
  // Récupérer le club du joueur
  const player = await db
    .select({ clubId: players.clubId })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player[0] || !player[0].clubId) return false;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Compter les matchs par joueur dans le club sur les 90 derniers jours
  const matchCounts = await db
    .select({
      playerId: players.id,
      matchCount: sql<number>`count(distinct ${matches.id})`.as('matchCount'),
    })
    .from(players)
    .leftJoin(
      matches,
      and(
        eq(players.clubId, player[0].clubId),
        gte(matches.playedAt, ninetyDaysAgo),
        eq(matches.validated, true),
        sql`(${matches.player1Id} = ${players.id} OR ${matches.player2Id} = ${players.id})`
      )
    )
    .where(
      and(
        eq(players.clubId, player[0].clubId),
        eq(players.isActive, true)
      )
    )
    .groupBy(players.id)
    .orderBy(sql`matchCount DESC`);

  if (matchCounts.length === 0) return false;

  // Trouver le joueur avec le plus de matchs
  const topPlayer = matchCounts[0];
  if (!topPlayer || topPlayer.matchCount === 0) return false;

  // Le joueur doit être celui avec le plus de matchs et avoir au moins 10 matchs
  return topPlayer.playerId === playerId && topPlayer.matchCount >= 10;
}

// ============================================
// TRIGGER POST-MATCH
// ============================================

/**
 * À appeler après chaque match pour vérifier les nouveaux badges
 * @returns Les badges nouvellement attribués pour chaque joueur
 */
export async function triggerBadgeCheckAfterMatch(
  player1Id: string,
  player2Id: string
): Promise<{ player1Badges: Badge[]; player2Badges: Badge[] }> {
  const [player1Badges, player2Badges] = await Promise.all([
    checkAndAwardBadges(player1Id),
    checkAndAwardBadges(player2Id),
  ]);

  return { player1Badges, player2Badges };
}
