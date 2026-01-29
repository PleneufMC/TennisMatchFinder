/**
 * Service de parrainage (Referral System)
 * 
 * Gère la création de liens de parrainage, le tracking des conversions
 * et l'attribution des badges Ambassador/Networker.
 */

import { db } from '@/lib/db';
import { 
  referrals, 
  playerReferralStats, 
  players, 
  playerBadges,
  notifications 
} from '@/lib/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';

// ============================================
// TYPES
// ============================================

export interface ReferralLink {
  url: string;
  playerId: string;
  referralCode?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  rewardedReferrals: number;
}

export interface ReferredPlayer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
  status: 'pending' | 'completed' | 'rewarded';
  joinedAt: Date | null;
}

// ============================================
// REFERRAL LINK GENERATION
// ============================================

/**
 * Génère le lien de parrainage pour un joueur
 */
export function generateReferralLink(
  playerId: string, 
  baseUrl: string = 'https://tennismatchfinder.net'
): ReferralLink {
  const url = `${baseUrl}/invite/${playerId}`;
  return {
    url,
    playerId,
  };
}

/**
 * Génère un code de parrainage personnalisé (optionnel)
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Évite les caractères ambigus
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================
// REFERRAL TRACKING
// ============================================

/**
 * Enregistre un clic sur un lien de parrainage
 */
export async function trackReferralClick(
  referrerId: string,
  referredEmail?: string,
  utmParams?: { source?: string; medium?: string; campaign?: string }
): Promise<string> {
  const [referral] = await db
    .insert(referrals)
    .values({
      referrerId,
      referredEmail,
      status: 'pending',
      clickedAt: new Date(),
      utmSource: utmParams?.source,
      utmMedium: utmParams?.medium,
      utmCampaign: utmParams?.campaign,
    })
    .returning();

  if (!referral) {
    throw new Error('Failed to create referral tracking');
  }

  return referral.id;
}

/**
 * Complète un parrainage quand le filleul s'inscrit
 */
export async function completeReferral(
  referrerId: string,
  referredId: string,
  referredEmail: string
): Promise<void> {
  // Chercher un parrainage existant avec cet email ou créer un nouveau
  const [existingReferral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, referrerId),
        eq(referrals.referredEmail, referredEmail.toLowerCase()),
        eq(referrals.status, 'pending')
      )
    )
    .limit(1);

  if (existingReferral) {
    // Mettre à jour le parrainage existant
    await db
      .update(referrals)
      .set({
        referredId,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(referrals.id, existingReferral.id));
  } else {
    // Créer un nouveau parrainage complété
    await db
      .insert(referrals)
      .values({
        referrerId,
        referredId,
        referredEmail: referredEmail.toLowerCase(),
        status: 'completed',
        completedAt: new Date(),
      });
  }

  // Mettre à jour les stats du parrain
  await updateReferralStats(referrerId);

  // Vérifier et attribuer les badges
  await checkAndAwardReferralBadges(referrerId);

  // Envoyer une notification au parrain
  await sendReferralNotification(referrerId, referredId);
}

/**
 * Met à jour les statistiques de parrainage d'un joueur
 */
export async function updateReferralStats(playerId: string): Promise<void> {
  // Compter les parrainages
  const [stats] = await db
    .select({
      total: count(),
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed' OR status = 'rewarded')`,
      rewarded: sql<number>`COUNT(*) FILTER (WHERE status = 'rewarded')`,
    })
    .from(referrals)
    .where(eq(referrals.referrerId, playerId));

  const total = stats?.total ?? 0;
  const completed = Number(stats?.completed ?? 0);
  const rewarded = Number(stats?.rewarded ?? 0);

  // Upsert des stats
  await db
    .insert(playerReferralStats)
    .values({
      playerId,
      totalReferrals: total,
      completedReferrals: completed,
      rewardedReferrals: rewarded,
      lastReferralAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: playerReferralStats.playerId,
      set: {
        totalReferrals: total,
        completedReferrals: completed,
        rewardedReferrals: rewarded,
        lastReferralAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

// ============================================
// BADGE ATTRIBUTION
// ============================================

/**
 * Vérifie et attribue les badges Ambassador et Networker
 */
export async function checkAndAwardReferralBadges(playerId: string): Promise<string[]> {
  const awardedBadges: string[] = [];

  // Récupérer les stats de parrainage
  const [stats] = await db
    .select()
    .from(playerReferralStats)
    .where(eq(playerReferralStats.playerId, playerId))
    .limit(1);

  const completedCount = stats?.completedReferrals ?? 0;

  // Badge Ambassador (3 filleuls)
  if (completedCount >= 3) {
    const awarded = await awardBadgeIfNotExists(playerId, 'ambassador', completedCount);
    if (awarded) awardedBadges.push('ambassador');
  }

  // Badge Networker (10 filleuls)
  if (completedCount >= 10) {
    const awarded = await awardBadgeIfNotExists(playerId, 'networker', completedCount);
    if (awarded) awardedBadges.push('networker');
  }

  return awardedBadges;
}

/**
 * Attribue un badge si le joueur ne l'a pas déjà
 */
async function awardBadgeIfNotExists(
  playerId: string, 
  badgeId: string, 
  progress: number
): Promise<boolean> {
  // Vérifier si le badge existe déjà
  const [existing] = await db
    .select()
    .from(playerBadges)
    .where(
      and(
        eq(playerBadges.playerId, playerId),
        eq(playerBadges.badgeId, badgeId)
      )
    )
    .limit(1);

  if (existing) {
    // Mettre à jour la progression si nécessaire
    if (existing.progress < progress) {
      await db
        .update(playerBadges)
        .set({ progress })
        .where(eq(playerBadges.id, existing.id));
    }
    return false;
  }

  // Attribuer le badge
  await db
    .insert(playerBadges)
    .values({
      playerId,
      badgeId,
      progress,
      seen: false,
      earnedAt: new Date(),
    });

  return true;
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Envoie une notification au parrain quand un filleul s'inscrit
 */
async function sendReferralNotification(
  referrerId: string,
  referredId: string
): Promise<void> {
  // Récupérer les infos du filleul
  const [referred] = await db
    .select({ fullName: players.fullName })
    .from(players)
    .where(eq(players.id, referredId))
    .limit(1);

  if (!referred) return;

  // Créer la notification
  await db
    .insert(notifications)
    .values({
      userId: referrerId,
      type: 'referral_completed',
      title: '🎉 Nouveau filleul !',
      message: `${referred.fullName} a rejoint TennisMatchFinder grâce à ton invitation !`,
      link: `/profil/${referredId}`,
      data: { referredId, referredName: referred.fullName },
    });
}

// ============================================
// QUERIES
// ============================================

/**
 * Récupère les statistiques de parrainage d'un joueur
 */
export async function getReferralStats(playerId: string): Promise<ReferralStats> {
  const [stats] = await db
    .select()
    .from(playerReferralStats)
    .where(eq(playerReferralStats.playerId, playerId))
    .limit(1);

  if (!stats) {
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      rewardedReferrals: 0,
    };
  }

  return {
    totalReferrals: stats.totalReferrals,
    completedReferrals: stats.completedReferrals,
    pendingReferrals: stats.totalReferrals - stats.completedReferrals,
    rewardedReferrals: stats.rewardedReferrals,
  };
}

/**
 * Récupère la liste des filleuls d'un joueur
 */
export async function getReferredPlayers(playerId: string): Promise<ReferredPlayer[]> {
  const referralsList = await db
    .select({
      referralId: referrals.id,
      referredId: referrals.referredId,
      status: referrals.status,
      completedAt: referrals.completedAt,
      playerFullName: players.fullName,
      playerAvatarUrl: players.avatarUrl,
      playerElo: players.currentElo,
    })
    .from(referrals)
    .leftJoin(players, eq(referrals.referredId, players.id))
    .where(eq(referrals.referrerId, playerId))
    .orderBy(sql`${referrals.completedAt} DESC NULLS LAST`);

  return referralsList
    .filter(r => r.referredId !== null)
    .map(r => ({
      id: r.referredId!,
      fullName: r.playerFullName || 'Joueur inconnu',
      avatarUrl: r.playerAvatarUrl,
      currentElo: r.playerElo || 1200,
      status: r.status as 'pending' | 'completed' | 'rewarded',
      joinedAt: r.completedAt,
    }));
}

/**
 * Vérifie si un joueur a été parrainé par un autre
 */
export async function wasReferredBy(
  playerId: string, 
  potentialReferrerId: string
): Promise<boolean> {
  const [referral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.referredId, playerId),
        eq(referrals.referrerId, potentialReferrerId)
      )
    )
    .limit(1);

  return !!referral;
}

/**
 * Récupère le parrain d'un joueur (si existe)
 */
export async function getReferrer(playerId: string): Promise<{ id: string; fullName: string } | null> {
  const [referral] = await db
    .select({
      referrerId: referrals.referrerId,
      referrerName: players.fullName,
    })
    .from(referrals)
    .innerJoin(players, eq(referrals.referrerId, players.id))
    .where(eq(referrals.referredId, playerId))
    .limit(1);

  if (!referral) return null;

  return {
    id: referral.referrerId,
    fullName: referral.referrerName,
  };
}
