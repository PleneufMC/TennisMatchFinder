/**
 * Trophy Case 2.0 - Badge Checker Service
 * 
 * Vérifie et attribue automatiquement les badges après chaque action.
 * 
 * Triggers possibles :
 * - 'match_completed' : Vérifie First Rally, Hot Streak, Century, Giant Killer, etc.
 * - 'elo_changed' : Vérifie Rising Star, King of Club
 * - 'tournament_won' : Vérifie Tournament Victor
 * - 'box_league_won' : Vérifie Box League Winner
 */

import { db } from '@/lib/db';
import { 
  players, 
  playerBadges, 
  badges, 
  matches, 
  eloHistory,
  notifications,
  tournaments,
  tournamentParticipants,
  boxLeagues,
  boxLeagueParticipants,
} from '@/lib/db/schema';
import { eq, and, desc, gte, sql, count, ne } from 'drizzle-orm';
import { BADGE_DEFINITIONS, getBadgeById } from './badges';

// Date limite Early Bird
const EARLY_BIRD_DEADLINE = new Date('2026-06-30T23:59:59');

// ============================================
// TYPES
// ============================================

export type BadgeTrigger = 
  | 'match_completed'
  | 'elo_changed'
  | 'tournament_won'
  | 'box_league_won'
  | 'profile_completed'
  | 'manual_check';

export interface BadgeCheckResult {
  badgeId: string;
  name: string;
  tier: string;
  isNew: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface PlayerStats {
  matchesPlayed: number;
  wins: number;
  winStreak: number;
  bestWinStreak: number;
  currentElo: number;
  uniqueOpponents: number;
  clubId: string | null;
  createdAt: Date;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Vérifie et attribue les badges après une action
 * Retourne uniquement les NOUVEAUX badges débloqués
 */
export async function checkAndAwardBadges(
  playerId: string,
  trigger: BadgeTrigger,
  context?: {
    opponentElo?: number;
    playerElo?: number;
    matchId?: string;
    wonMatch?: boolean;
    opponentId?: string;
  }
): Promise<BadgeCheckResult[]> {
  const newBadges: BadgeCheckResult[] = [];
  
  try {
    // Récupérer les stats du joueur
    const playerStats = await getPlayerStats(playerId);
    if (!playerStats) return [];
    
    // Récupérer les badges déjà obtenus
    const existingBadges = await getPlayerBadges(playerId);
    const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));
    
    // Vérifier chaque badge selon le trigger
    for (const badge of BADGE_DEFINITIONS) {
      // Skip si déjà obtenu (sauf badges dynamiques)
      if (existingBadgeIds.has(badge.id) && !badge.isDynamic) {
        continue;
      }
      
      // Vérifier le badge
      const result = await checkBadge(
        badge.id,
        playerId,
        playerStats,
        trigger,
        context
      );
      
      if (result.earned && !existingBadgeIds.has(badge.id)) {
        // Nouveau badge débloqué !
        await awardBadge(playerId, badge.id, result.progress);
        
        newBadges.push({
          badgeId: badge.id,
          name: badge.name,
          tier: badge.tier,
          isNew: true,
          progress: result.progress,
          maxProgress: badge.maxProgress,
        });
      } else if (result.progress && badge.maxProgress) {
        // Mettre à jour la progression même si pas encore débloqué
        await updateBadgeProgress(playerId, badge.id, result.progress);
      }
    }
    
    // Envoyer notifications pour les nouveaux badges
    for (const badge of newBadges) {
      await createBadgeNotification(playerId, badge.badgeId);
    }
    
    return newBadges;
    
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

// ============================================
// BADGE CHECK FUNCTIONS
// ============================================

async function checkBadge(
  badgeId: string,
  playerId: string,
  stats: PlayerStats,
  trigger: BadgeTrigger,
  context?: {
    opponentElo?: number;
    playerElo?: number;
    matchId?: string;
    wonMatch?: boolean;
    opponentId?: string;
  }
): Promise<{ earned: boolean; progress?: number }> {
  
  switch (badgeId) {
    // --- JALONS ---
    case 'first-rally':
      return { earned: stats.matchesPlayed >= 1, progress: Math.min(stats.matchesPlayed, 1) };
    
    case 'getting-started':
      return { earned: stats.matchesPlayed >= 10, progress: Math.min(stats.matchesPlayed, 10) };
    
    case 'regular':
      return { earned: stats.matchesPlayed >= 25, progress: Math.min(stats.matchesPlayed, 25) };
    
    case 'dedicated':
      return { earned: stats.matchesPlayed >= 50, progress: Math.min(stats.matchesPlayed, 50) };
    
    case 'century':
      return { earned: stats.matchesPlayed >= 100, progress: Math.min(stats.matchesPlayed, 100) };
    
    // --- EXPLOITS ---
    case 'hot-streak':
      return { earned: stats.winStreak >= 3, progress: Math.min(stats.winStreak, 3) };
    
    case 'on-fire':
      return { earned: stats.winStreak >= 5, progress: Math.min(stats.winStreak, 5) };
    
    case 'giant-killer':
      return checkGiantKiller(playerId, context);
    
    case 'rising-star':
      return checkRisingStar(playerId);
    
    // --- SOCIAL ---
    case 'social-butterfly':
      return { earned: stats.uniqueOpponents >= 10, progress: Math.min(stats.uniqueOpponents, 10) };
    
    case 'club-pillar':
      return { earned: stats.uniqueOpponents >= 25, progress: Math.min(stats.uniqueOpponents, 25) };
    
    case 'rival-master':
      return checkRivalMaster(playerId);
    
    case 'welcome-committee':
      return checkWelcomeCommittee(playerId);
    
    // --- SPÉCIAL ---
    case 'king-of-club':
      return checkKingOfClub(playerId, stats.clubId);
    
    case 'founding-member':
      return { earned: stats.createdAt <= EARLY_BIRD_DEADLINE };
    
    case 'tournament-victor':
      return checkTournamentVictor(playerId);
    
    case 'box-league-winner':
      return checkBoxLeagueWinner(playerId);
    
    case 'reliable-partner':
      return checkReliablePartner(playerId);
    
    default:
      return { earned: false };
  }
}

// --- Checks spéciaux ---

async function checkGiantKiller(
  playerId: string,
  context?: { opponentElo?: number; playerElo?: number; wonMatch?: boolean }
): Promise<{ earned: boolean }> {
  // Si on a le contexte du match actuel
  if (context?.wonMatch && context.opponentElo && context.playerElo) {
    const eloDiff = context.opponentElo - context.playerElo;
    if (eloDiff >= 200) {
      return { earned: true };
    }
  }
  
  // Sinon, vérifier l'historique
  const giantKills = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.winnerId, playerId),
        sql`(
          CASE 
            WHEN ${matches.player1Id} = ${playerId} 
            THEN ${matches.player2EloBefore} - ${matches.player1EloBefore}
            ELSE ${matches.player1EloBefore} - ${matches.player2EloBefore}
          END
        ) >= 200`
      )
    )
    .limit(1);
  
  return { earned: giantKills.length > 0 };
}

async function checkRisingStar(playerId: string): Promise<{ earned: boolean }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Récupérer l'ELO d'il y a 30 jours
  const [oldestInRange] = await db
    .select({ elo: eloHistory.elo })
    .from(eloHistory)
    .where(
      and(
        eq(eloHistory.playerId, playerId),
        gte(eloHistory.recordedAt, thirtyDaysAgo)
      )
    )
    .orderBy(eloHistory.recordedAt)
    .limit(1);
  
  if (!oldestInRange) return { earned: false };
  
  // Récupérer l'ELO actuel
  const [player] = await db
    .select({ currentElo: players.currentElo })
    .from(players)
    .where(eq(players.id, playerId));
  
  if (!player) return { earned: false };
  
  const eloGain = player.currentElo - oldestInRange.elo;
  return { earned: eloGain >= 100 };
}

async function checkRivalMaster(playerId: string): Promise<{ earned: boolean; progress: number }> {
  // Trouver l'adversaire le plus fréquent
  const rivalries = await db
    .select({
      opponentId: sql<string>`
        CASE 
          WHEN ${matches.player1Id} = ${playerId} THEN ${matches.player2Id}
          ELSE ${matches.player1Id}
        END
      `,
      matchCount: count(),
    })
    .from(matches)
    .where(
      sql`${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId}`
    )
    .groupBy(sql`
      CASE 
        WHEN ${matches.player1Id} = ${playerId} THEN ${matches.player2Id}
        ELSE ${matches.player1Id}
      END
    `)
    .orderBy(desc(count()))
    .limit(1);
  
  const maxMatches = rivalries[0]?.matchCount ?? 0;
  return { 
    earned: maxMatches >= 10, 
    progress: Math.min(maxMatches, 10) 
  };
}

async function checkWelcomeCommittee(playerId: string): Promise<{ earned: boolean; progress: number }> {
  // Compter les joueurs dont c'était le premier match avec ce joueur
  const welcomedPlayers = await db
    .select({ count: count() })
    .from(
      db
        .select({
          opponentId: sql<string>`
            CASE 
              WHEN ${matches.player1Id} = ${playerId} THEN ${matches.player2Id}
              ELSE ${matches.player1Id}
            END
          `,
          matchDate: matches.playedAt,
        })
        .from(matches)
        .where(
          sql`${matches.player1Id} = ${playerId} OR ${matches.player2Id} = ${playerId}`
        )
        .as('first_matches')
    )
    .where(
      sql`first_matches.match_date = (
        SELECT MIN(m2.played_at) 
        FROM matches m2 
        WHERE m2.player1_id = first_matches.opponent_id 
           OR m2.player2_id = first_matches.opponent_id
      )`
    );
  
  const welcomeCount = welcomedPlayers[0]?.count ?? 0;
  return { 
    earned: welcomeCount >= 5, 
    progress: Math.min(welcomeCount, 5) 
  };
}

async function checkKingOfClub(
  playerId: string,
  clubId: string | null
): Promise<{ earned: boolean }> {
  if (!clubId) return { earned: false };
  
  // Vérifier si le joueur est #1 ELO du club
  const [topPlayer] = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        eq(players.clubId, clubId),
        eq(players.isActive, true)
      )
    )
    .orderBy(desc(players.currentElo))
    .limit(1);
  
  return { earned: topPlayer?.id === playerId };
}

async function checkTournamentVictor(playerId: string): Promise<{ earned: boolean }> {
  const [victory] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.winnerId, playerId))
    .limit(1);
  
  return { earned: !!victory };
}

async function checkBoxLeagueWinner(playerId: string): Promise<{ earned: boolean }> {
  const [victory] = await db
    .select()
    .from(boxLeagueParticipants)
    .where(
      and(
        eq(boxLeagueParticipants.playerId, playerId),
        eq(boxLeagueParticipants.finalRank, 1)
      )
    )
    .limit(1);
  
  return { earned: !!victory };
}

async function checkReliablePartner(playerId: string): Promise<{ earned: boolean }> {
  // Vérifier si le joueur a une réputation >= 4.5 avec au moins 5 évaluations
  const [player] = await db
    .select({
      reputationAvg: players.reputationAvg,
      reputationCount: players.reputationCount,
    })
    .from(players)
    .where(eq(players.id, playerId));
  
  if (!player) return { earned: false };
  
  const avgRating = player.reputationAvg ? Number(player.reputationAvg) : 0;
  const ratingCount = player.reputationCount || 0;
  
  return { 
    earned: avgRating >= 4.5 && ratingCount >= 5 
  };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function getPlayerStats(playerId: string): Promise<PlayerStats | null> {
  const [player] = await db
    .select({
      matchesPlayed: players.matchesPlayed,
      wins: players.wins,
      winStreak: players.winStreak,
      bestWinStreak: players.bestWinStreak,
      currentElo: players.currentElo,
      uniqueOpponents: players.uniqueOpponents,
      clubId: players.clubId,
      createdAt: players.createdAt,
    })
    .from(players)
    .where(eq(players.id, playerId));
  
  return player || null;
}

async function getPlayerBadges(playerId: string) {
  try {
    return await db
      .select({
        badgeId: playerBadges.badgeId,
        progress: playerBadges.progress,
        earnedAt: playerBadges.earnedAt,
      })
      .from(playerBadges)
      .where(eq(playerBadges.playerId, playerId));
  } catch (error) {
    console.warn('[Badge Checker] getPlayerBadges failed, returning empty array:', error);
    return [];
  }
}

async function awardBadge(
  playerId: string,
  badgeId: string,
  progress?: number
): Promise<void> {
  try {
    const badge = getBadgeById(badgeId);
    
    await db.insert(playerBadges).values({
      playerId,
      badgeId,
      progress: progress ?? badge?.maxProgress ?? 0,
      seen: false,
      earnedAt: new Date(),
    });
    
    console.log(`🏆 Badge awarded: ${badgeId} to player ${playerId}`);
  } catch (error) {
    console.warn('[Badge Checker] awardBadge failed:', error);
  }
}

async function updateBadgeProgress(
  playerId: string,
  badgeId: string,
  progress: number
): Promise<void> {
  try {
    // Vérifier si une entrée existe déjà
    const [existing] = await db
      .select()
      .from(playerBadges)
      .where(
        and(
          eq(playerBadges.playerId, playerId),
          eq(playerBadges.badgeId, badgeId)
        )
      );
    
    if (existing) {
      // Update progress si supérieur
      if (progress > existing.progress) {
        await db
          .update(playerBadges)
          .set({ progress })
          .where(eq(playerBadges.id, existing.id));
      }
    }
    // Note: on ne crée pas d'entrée si le badge n'est pas encore gagné
    // La progression est trackée seulement après obtention
  } catch (error) {
    console.warn('[Badge Checker] updateBadgeProgress failed:', error);
  }
}

async function createBadgeNotification(
  playerId: string,
  badgeId: string
): Promise<void> {
  try {
    const badge = getBadgeById(badgeId);
    if (!badge) return;
    
    await db.insert(notifications).values({
      userId: playerId,
      type: 'badge_earned',
      title: '🏆 Nouveau badge débloqué !',
      message: `Tu as obtenu le badge "${badge.name}" - ${badge.description}`,
      link: '/achievements',
      data: { badgeId, tier: badge.tier },
    });
  } catch (error) {
    console.warn('[Badge Checker] createBadgeNotification failed:', error);
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Marque un badge comme "vu" (célébration affichée)
 * Backward-compatible: ignore silencieusement si la table n'existe pas
 */
export async function markBadgeAsSeen(
  playerId: string,
  badgeId: string
): Promise<void> {
  try {
    await db
      .update(playerBadges)
      .set({ 
        seen: true,
        seenAt: new Date(),
      })
      .where(
        and(
          eq(playerBadges.playerId, playerId),
          eq(playerBadges.badgeId, badgeId)
        )
      );
  } catch (error) {
    console.warn('[Badge Checker] markBadgeAsSeen failed:', error);
  }
}

/**
 * Récupère tous les badges non vus pour un joueur
 * Backward-compatible: retourne tableau vide si la table n'existe pas encore
 */
export async function getUnseenBadges(playerId: string): Promise<BadgeCheckResult[]> {
  try {
    const unseen = await db
      .select({
        badgeId: playerBadges.badgeId,
        progress: playerBadges.progress,
      })
      .from(playerBadges)
      .where(
        and(
          eq(playerBadges.playerId, playerId),
          eq(playerBadges.seen, false)
        )
      );
    
    return unseen.map(b => {
      const badge = getBadgeById(b.badgeId);
      return {
        badgeId: b.badgeId,
        name: badge?.name ?? 'Unknown',
        tier: badge?.tier ?? 'common',
        isNew: true,
        progress: b.progress,
        maxProgress: badge?.maxProgress,
      };
    });
  } catch (error) {
    console.warn('[Badge Checker] getUnseenBadges failed, returning empty array:', error);
    return [];
  }
}

/**
 * Récupère tous les badges d'un joueur (pour le Trophy Case)
 * Backward-compatible: retourne tableau vide si la table n'existe pas encore
 */
export async function getPlayerBadgesForDisplay(playerId: string) {
  try {
    const result = await db
      .select({
        badgeId: playerBadges.badgeId,
        progress: playerBadges.progress,
        earnedAt: playerBadges.earnedAt,
        seen: playerBadges.seen,
      })
      .from(playerBadges)
      .where(eq(playerBadges.playerId, playerId));
    return result;
  } catch (error) {
    // Si la table n'existe pas encore ou erreur de structure,
    // retourne un tableau vide pour ne pas bloquer l'UI
    console.warn('[Badge Checker] getPlayerBadgesForDisplay failed, returning empty array:', error);
    return [];
  }
}

/**
 * Retire un badge dynamique (ex: King of Club détrôné)
 * Backward-compatible: ignore silencieusement si la table n'existe pas
 */
export async function revokeDynamicBadge(
  playerId: string,
  badgeId: string
): Promise<void> {
  try {
    await db
      .delete(playerBadges)
      .where(
        and(
          eq(playerBadges.playerId, playerId),
          eq(playerBadges.badgeId, badgeId)
        )
      );
    
    console.log(`👑 Dynamic badge revoked: ${badgeId} from player ${playerId}`);
  } catch (error) {
    console.warn('[Badge Checker] revokeDynamicBadge failed:', error);
  }
}

/**
 * Vérifie et attribue les badges "passifs" (Founding Member, etc.)
 * Appelé au login ou manuellement
 */
export async function checkPassiveBadges(playerId: string): Promise<BadgeCheckResult[]> {
  const newBadges: BadgeCheckResult[] = [];
  
  try {
    const playerStats = await getPlayerStats(playerId);
    if (!playerStats) return [];
    
    const existingBadges = await getPlayerBadges(playerId);
    const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));
    
    // Badge Founding Member
    if (!existingBadgeIds.has('founding-member')) {
      if (playerStats.createdAt <= EARLY_BIRD_DEADLINE) {
        await awardBadge(playerId, 'founding-member');
        await createBadgeNotification(playerId, 'founding-member');
        
        const badge = getBadgeById('founding-member');
        newBadges.push({
          badgeId: 'founding-member',
          name: badge?.name ?? 'Founding Member',
          tier: badge?.tier ?? 'legendary',
          isNew: true,
        });
        
        console.log(`🌟 Founding Member badge awarded to player ${playerId}`);
      }
    }
    
    // Badge Reliable Partner (peut être gagné passivement si conditions remplies)
    if (!existingBadgeIds.has('reliable-partner')) {
      const result = await checkReliablePartner(playerId);
      if (result.earned) {
        await awardBadge(playerId, 'reliable-partner');
        await createBadgeNotification(playerId, 'reliable-partner');
        
        const badge = getBadgeById('reliable-partner');
        newBadges.push({
          badgeId: 'reliable-partner',
          name: badge?.name ?? 'Partenaire Fiable',
          tier: badge?.tier ?? 'rare',
          isNew: true,
        });
      }
    }
    
    return newBadges;
  } catch (error) {
    console.error('[Badge Checker] checkPassiveBadges failed:', error);
    return [];
  }
}

/**
 * Attribue le badge Founding Member à tous les joueurs éligibles
 * Fonction admin/CRON pour attribution en masse
 */
export async function awardFoundingMemberToAllEligible(): Promise<{
  awarded: number;
  alreadyHad: number;
  notEligible: number;
}> {
  let awarded = 0;
  let alreadyHad = 0;
  let notEligible = 0;
  
  try {
    // Récupérer tous les joueurs
    const allPlayers = await db
      .select({
        id: players.id,
        createdAt: players.createdAt,
      })
      .from(players);
    
    for (const player of allPlayers) {
      // Vérifier si déjà obtenu
      const [existingBadge] = await db
        .select()
        .from(playerBadges)
        .where(
          and(
            eq(playerBadges.playerId, player.id),
            eq(playerBadges.badgeId, 'founding-member')
          )
        );
      
      if (existingBadge) {
        alreadyHad++;
        continue;
      }
      
      // Vérifier éligibilité
      if (player.createdAt <= EARLY_BIRD_DEADLINE) {
        await awardBadge(player.id, 'founding-member');
        await createBadgeNotification(player.id, 'founding-member');
        awarded++;
      } else {
        notEligible++;
      }
    }
    
    console.log(`[Founding Member] Awarded: ${awarded}, Already had: ${alreadyHad}, Not eligible: ${notEligible}`);
    
    return { awarded, alreadyHad, notEligible };
  } catch (error) {
    console.error('[Badge Checker] awardFoundingMemberToAllEligible failed:', error);
    return { awarded, alreadyHad, notEligible };
  }
}

/**
 * Trigger appelé après chaque match pour les deux joueurs
 */
export async function triggerBadgeCheckAfterMatch(
  player1Id: string,
  player2Id: string,
  winnerId: string,
  matchDetails: {
    player1Elo: number;
    player2Elo: number;
    matchId: string;
    clubId?: string;
  }
): Promise<{ player1Badges: BadgeCheckResult[]; player2Badges: BadgeCheckResult[] }> {
  const isPlayer1Winner = winnerId === player1Id;
  
  const [player1Badges, player2Badges] = await Promise.all([
    checkAndAwardBadges(player1Id, 'match_completed', {
      opponentElo: matchDetails.player2Elo,
      playerElo: matchDetails.player1Elo,
      matchId: matchDetails.matchId,
      wonMatch: isPlayer1Winner,
      opponentId: player2Id,
    }),
    checkAndAwardBadges(player2Id, 'match_completed', {
      opponentElo: matchDetails.player1Elo,
      playerElo: matchDetails.player2Elo,
      matchId: matchDetails.matchId,
      wonMatch: !isPlayer1Winner,
      opponentId: player1Id,
    }),
  ]);
  
  // Vérifier King of Club si dans un club
  if (matchDetails.clubId) {
    await updateKingOfClub(matchDetails.clubId);
  }
  
  return { player1Badges, player2Badges };
}

/**
 * Met à jour le badge King of Club après changement d'ELO
 */
async function updateKingOfClub(clubId: string): Promise<void> {
  // Récupérer le nouveau #1
  const [newKing] = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        eq(players.clubId, clubId),
        eq(players.isActive, true)
      )
    )
    .orderBy(desc(players.currentElo))
    .limit(1);
  
  if (!newKing) return;
  
  // Récupérer l'ancien King
  const [oldKingBadge] = await db
    .select({ playerId: playerBadges.playerId })
    .from(playerBadges)
    .innerJoin(players, eq(players.id, playerBadges.playerId))
    .where(
      and(
        eq(playerBadges.badgeId, 'king-of-club'),
        eq(players.clubId, clubId)
      )
    );
  
  const oldKingId = oldKingBadge?.playerId;
  
  // Si le roi a changé
  if (oldKingId !== newKing.id) {
    // Retirer l'ancien badge
    if (oldKingId) {
      await revokeDynamicBadge(oldKingId, 'king-of-club');
      
      // Notifier l'ancien roi
      await db.insert(notifications).values({
        userId: oldKingId,
        type: 'badge_lost',
        title: '👑 Détrôné !',
        message: 'Tu as perdu le titre de King of Club. Reconquiers ta couronne !',
        link: '/classement',
        data: { badgeId: 'king-of-club' },
      });
    }
    
    // Attribuer au nouveau roi
    await awardBadge(newKing.id, 'king-of-club');
    await createBadgeNotification(newKing.id, 'king-of-club');
  }
}
