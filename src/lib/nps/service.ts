/**
 * Service NPS (Net Promoter Score)
 * 
 * Gère la logique de déclenchement et d'enregistrement des surveys NPS.
 * 
 * NPS = % Promoteurs (9-10) - % Détracteurs (0-6)
 * Passifs = 7-8
 */

import { db } from '@/lib/db';
import { npsSurveys, players } from '@/lib/db/schema';
import { eq, and, gte, desc, sql, count } from 'drizzle-orm';

// ============================================
// CONSTANTS
// ============================================

// Seuils de déclenchement
export const NPS_TRIGGERS = {
  MATCHES_MILESTONE: 5,      // Après X matchs
  DAYS_SINCE_SIGNUP: 30,     // Après X jours d'inscription
  COOLDOWN_DAYS: 90,         // Minimum entre 2 surveys
} as const;

// Catégorisation des scores
export const NPS_CATEGORIES = {
  DETRACTOR: { min: 0, max: 6, label: 'Détracteur' },
  PASSIVE: { min: 7, max: 8, label: 'Passif' },
  PROMOTER: { min: 9, max: 10, label: 'Promoteur' },
} as const;

// ============================================
// TYPES
// ============================================

export interface NpsEligibility {
  eligible: boolean;
  reason: 'matches_milestone' | 'days_since_signup' | null;
  triggerValue: number | null;
  lastSurveyAt: Date | null;
}

export interface NpsStats {
  totalResponses: number;
  averageScore: number;
  npsScore: number; // -100 to +100
  detractors: number;
  passives: number;
  promoters: number;
  detractorsPct: number;
  passivesPct: number;
  promotersPct: number;
}

export interface NpsResponse {
  id: string;
  playerId: string;
  playerName: string;
  score: number;
  feedback: string | null;
  category: 'detractor' | 'passive' | 'promoter';
  createdAt: Date;
}

// ============================================
// ELIGIBILITY CHECK
// ============================================

/**
 * Vérifie si un joueur est éligible pour recevoir un survey NPS
 */
export async function checkNpsEligibility(playerId: string): Promise<NpsEligibility> {
  // Récupérer les infos du joueur
  const [player] = await db
    .select({
      matchesPlayed: players.matchesPlayed,
      createdAt: players.createdAt,
    })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player) {
    return { eligible: false, reason: null, triggerValue: null, lastSurveyAt: null };
  }

  // Vérifier le dernier survey (cooldown)
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - NPS_TRIGGERS.COOLDOWN_DAYS);

  const [lastSurvey] = await db
    .select({ createdAt: npsSurveys.createdAt })
    .from(npsSurveys)
    .where(
      and(
        eq(npsSurveys.playerId, playerId),
        eq(npsSurveys.dismissed, false) // Ignorer les surveys fermés sans réponse
      )
    )
    .orderBy(desc(npsSurveys.createdAt))
    .limit(1);

  // Si un survey récent existe, pas éligible
  if (lastSurvey && lastSurvey.createdAt > cooldownDate) {
    return { 
      eligible: false, 
      reason: null, 
      triggerValue: null, 
      lastSurveyAt: lastSurvey.createdAt 
    };
  }

  // Vérifier le milestone de matchs (priorité)
  if (player.matchesPlayed >= NPS_TRIGGERS.MATCHES_MILESTONE) {
    // Vérifier si on a déjà fait un survey pour ce milestone
    const [existingMilestoneSurvey] = await db
      .select()
      .from(npsSurveys)
      .where(
        and(
          eq(npsSurveys.playerId, playerId),
          eq(npsSurveys.triggerReason, 'matches_milestone'),
          eq(npsSurveys.triggerValue, NPS_TRIGGERS.MATCHES_MILESTONE)
        )
      )
      .limit(1);

    if (!existingMilestoneSurvey) {
      return {
        eligible: true,
        reason: 'matches_milestone',
        triggerValue: NPS_TRIGGERS.MATCHES_MILESTONE,
        lastSurveyAt: lastSurvey?.createdAt || null,
      };
    }
  }

  // Vérifier les jours depuis l'inscription
  const daysSinceSignup = Math.floor(
    (Date.now() - player.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceSignup >= NPS_TRIGGERS.DAYS_SINCE_SIGNUP) {
    // Vérifier si on a déjà fait un survey pour ce trigger
    const [existingDaysSurvey] = await db
      .select()
      .from(npsSurveys)
      .where(
        and(
          eq(npsSurveys.playerId, playerId),
          eq(npsSurveys.triggerReason, 'days_since_signup')
        )
      )
      .limit(1);

    if (!existingDaysSurvey) {
      return {
        eligible: true,
        reason: 'days_since_signup',
        triggerValue: daysSinceSignup,
        lastSurveyAt: lastSurvey?.createdAt || null,
      };
    }
  }

  return { 
    eligible: false, 
    reason: null, 
    triggerValue: null, 
    lastSurveyAt: lastSurvey?.createdAt || null 
  };
}

// ============================================
// SURVEY SUBMISSION
// ============================================

/**
 * Enregistre une réponse NPS
 */
export async function submitNpsSurvey(params: {
  playerId: string;
  score: number;
  feedback?: string;
  triggerReason: 'matches_milestone' | 'days_since_signup' | 'manual';
  triggerValue?: number;
}): Promise<{ success: boolean; surveyId?: string; error?: string }> {
  const { playerId, score, feedback, triggerReason, triggerValue } = params;

  // Validation du score
  if (score < 0 || score > 10 || !Number.isInteger(score)) {
    return { success: false, error: 'Score invalide (0-10 requis)' };
  }

  try {
    const [survey] = await db
      .insert(npsSurveys)
      .values({
        playerId,
        score,
        feedback: feedback?.trim() || null,
        triggerReason,
        triggerValue,
        dismissed: false,
      })
      .returning();

    if (!survey) {
      return { success: false, error: 'Erreur lors de l\'enregistrement' };
    }

    return { success: true, surveyId: survey.id };
  } catch (error) {
    console.error('NPS submission error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Enregistre un survey fermé sans réponse (dismissed)
 */
export async function dismissNpsSurvey(params: {
  playerId: string;
  triggerReason: 'matches_milestone' | 'days_since_signup' | 'manual';
  triggerValue?: number;
}): Promise<void> {
  await db.insert(npsSurveys).values({
    playerId: params.playerId,
    score: 0, // Placeholder
    triggerReason: params.triggerReason,
    triggerValue: params.triggerValue,
    dismissed: true,
  });
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Calcule les statistiques NPS globales
 */
export async function getNpsStats(options?: {
  fromDate?: Date;
  toDate?: Date;
}): Promise<NpsStats> {
  const conditions = [eq(npsSurveys.dismissed, false)];

  if (options?.fromDate) {
    conditions.push(gte(npsSurveys.createdAt, options.fromDate));
  }

  const surveys = await db
    .select({ score: npsSurveys.score })
    .from(npsSurveys)
    .where(and(...conditions));

  if (surveys.length === 0) {
    return {
      totalResponses: 0,
      averageScore: 0,
      npsScore: 0,
      detractors: 0,
      passives: 0,
      promoters: 0,
      detractorsPct: 0,
      passivesPct: 0,
      promotersPct: 0,
    };
  }

  let detractors = 0;
  let passives = 0;
  let promoters = 0;
  let totalScore = 0;

  for (const survey of surveys) {
    totalScore += survey.score;

    if (survey.score <= NPS_CATEGORIES.DETRACTOR.max) {
      detractors++;
    } else if (survey.score <= NPS_CATEGORIES.PASSIVE.max) {
      passives++;
    } else {
      promoters++;
    }
  }

  const total = surveys.length;
  const detractorsPct = Math.round((detractors / total) * 100);
  const passivesPct = Math.round((passives / total) * 100);
  const promotersPct = Math.round((promoters / total) * 100);
  const npsScore = promotersPct - detractorsPct;

  return {
    totalResponses: total,
    averageScore: Math.round((totalScore / total) * 10) / 10,
    npsScore,
    detractors,
    passives,
    promoters,
    detractorsPct,
    passivesPct,
    promotersPct,
  };
}

/**
 * Récupère les dernières réponses NPS avec feedback
 */
export async function getRecentNpsResponses(limit: number = 20): Promise<NpsResponse[]> {
  const responses = await db
    .select({
      id: npsSurveys.id,
      playerId: npsSurveys.playerId,
      playerName: players.fullName,
      score: npsSurveys.score,
      feedback: npsSurveys.feedback,
      createdAt: npsSurveys.createdAt,
    })
    .from(npsSurveys)
    .innerJoin(players, eq(npsSurveys.playerId, players.id))
    .where(eq(npsSurveys.dismissed, false))
    .orderBy(desc(npsSurveys.createdAt))
    .limit(limit);

  return responses.map((r) => ({
    ...r,
    category: getScoreCategory(r.score),
  }));
}

/**
 * Détermine la catégorie d'un score
 */
export function getScoreCategory(score: number): 'detractor' | 'passive' | 'promoter' {
  if (score <= NPS_CATEGORIES.DETRACTOR.max) return 'detractor';
  if (score <= NPS_CATEGORIES.PASSIVE.max) return 'passive';
  return 'promoter';
}

/**
 * Obtient la couleur associée à un score
 */
export function getScoreColor(score: number): string {
  if (score <= 6) return 'text-red-500';
  if (score <= 8) return 'text-yellow-500';
  return 'text-green-500';
}

/**
 * Obtient la couleur de fond associée à un score
 */
export function getScoreBgColor(score: number): string {
  if (score <= 6) return 'bg-red-100 dark:bg-red-900/30';
  if (score <= 8) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-green-100 dark:bg-green-900/30';
}
