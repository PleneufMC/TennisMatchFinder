/**
 * Calculateur ELO avec système de coefficients par format
 * 
 * Formule complète :
 * NouvelELO = AncienELO + K × FormatCoef × MarginMod × AutresModificateurs × (Résultat - Attendu)
 */

import { 
  FORMAT_COEFFICIENTS, 
  getMarginModifier, 
  type MatchFormat 
} from './format-coefficients';
import { ELO_CONSTANTS, DEFAULT_ELO_CONFIG } from './types';
import type { PlayerForCalculation, MatchForCalculation, EloChangeResult, MatchEloResult } from './types';
import { calculateModifiers } from './modifiers';

// ============================================
// CONFIGURATION
// ============================================

export const ELO_CONFIG = {
  // K-Factor dynamique selon expérience
  K_FACTOR_NEW: 40,      // < 10 matchs
  K_FACTOR_INTER: 32,    // 10-30 matchs  
  K_FACTOR_ESTABLISHED: 24, // > 30 matchs
  
  // Bonus/Malus existants
  NEW_OPPONENT_BONUS: 1.15,    // +15% pour nouvel adversaire
  UPSET_BONUS: 1.20,           // +20% si victoire exploit (+100 ELO)
  UPSET_THRESHOLD: 100,        // Seuil pour considérer un upset
  REPEAT_PENALTY_PER_MATCH: 0.05, // -5% par match récent vs même adversaire
  REPEAT_PENALTY_MIN: 0.70,    // Plancher du malus répétition
  DIVERSITY_BONUS: 1.10,       // +10% si 3+ adversaires cette semaine
  DIVERSITY_THRESHOLD: 3,      // Seuil pour bonus diversité
  
  // Ratio perdant
  LOSER_RATIO: 0.8,            // Le perdant perd 80% du gain du gagnant
} as const;

// ============================================
// TYPES
// ============================================

export interface EloCalculationParams {
  winnerElo: number;
  loserElo: number;
  winnerMatchCount: number;
  loserMatchCount: number;
  matchFormat: MatchFormat;
  // Scores pour calcul marge (optionnel)
  winnerGames?: number;
  loserGames?: number;
  // Modificateurs contextuels
  isNewOpponent?: boolean;
  recentMatchesVsSameOpponent?: number;
  weeklyUniqueOpponents?: number;
}

export interface EloBreakdown {
  kFactor: number;
  kFactorLabel: string;
  expectedScore: number;
  winProbability: number; // en pourcentage
  formatCoefficient: number;
  formatLabel: string;
  marginModifier: number;
  marginLabel: string;
  newOpponentBonus: number;
  upsetBonus: number;
  repetitionMalus: number;
  diversityBonus: number;
  rawChange: number;
  finalChange: number;
}

export interface EloCalculationResult {
  winnerDelta: number;
  loserDelta: number;
  breakdown: EloBreakdown;
}

/**
 * Convertit un EloBreakdown (champs plats renvoyés par l'API /api/matches)
 * en ModifiersResult ({ totalModifier, details[] }) attendu par les
 * composants d'affichage (EloBreakdown UI / MatchResultModal).
 *
 * Chaque modificateur est un multiplicateur (×). On ne liste dans `details`
 * que ceux qui dévient de 1.0 (i.e. ceux réellement appliqués au calcul).
 */
export function breakdownToModifiers(
  breakdown: EloBreakdown
): import('./types').ModifiersResult {
  const details: import('./types').ModifierDetail[] = [];

  if (breakdown.newOpponentBonus !== 1.0) {
    details.push({
      type: 'new_opponent',
      value: breakdown.newOpponentBonus,
      description: 'Nouvel adversaire',
    });
  }

  if (breakdown.upsetBonus !== 1.0) {
    details.push({
      type: 'upset',
      value: breakdown.upsetBonus,
      description: 'Victoire face à un joueur mieux classé',
    });
  }

  if (breakdown.repetitionMalus !== 1.0) {
    details.push({
      type: 'repetition',
      value: breakdown.repetitionMalus,
      description: 'Adversaire affronté récemment',
    });
  }

  if (breakdown.diversityBonus !== 1.0) {
    details.push({
      type: 'weekly_diversity',
      value: breakdown.diversityBonus,
      description: 'Diversité des adversaires cette semaine',
    });
  }

  // totalModifier = produit de tous les multiplicateurs (y.c. format & marge,
  // qui ne sont pas typés comme ModifierType mais entrent dans le calcul).
  const totalModifier =
    breakdown.formatCoefficient *
    breakdown.marginModifier *
    breakdown.newOpponentBonus *
    breakdown.upsetBonus *
    breakdown.repetitionMalus *
    breakdown.diversityBonus;

  return {
    totalModifier: totalModifier === 0 ? 1 : totalModifier,
    details,
  };
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * K Factor dynamique selon l'expérience du joueur
 */
export function getKFactor(matchCount: number): number {
  if (matchCount < 10) return ELO_CONFIG.K_FACTOR_NEW;
  if (matchCount < 30) return ELO_CONFIG.K_FACTOR_INTER;
  return ELO_CONFIG.K_FACTOR_ESTABLISHED;
}

/**
 * Label pour le K-Factor
 */
export function getKFactorLabel(matchCount: number): string {
  if (matchCount < 10) return 'Nouveau joueur';
  if (matchCount < 30) return 'Intermédiaire';
  return 'Établi';
}

/**
 * Calcule le score attendu (probabilité de victoire)
 */
export function calculateExpectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Calcule le changement ELO avec tous les modificateurs
 */
export function calculateEloChange(params: EloCalculationParams): EloCalculationResult {
  const {
    winnerElo,
    loserElo,
    winnerMatchCount,
    loserMatchCount,
    matchFormat,
    winnerGames,
    loserGames,
    isNewOpponent = false,
    recentMatchesVsSameOpponent = 0,
    weeklyUniqueOpponents = 0,
  } = params;

  // 1. K Factor dynamique (moyenne des deux joueurs pour équité)
  const winnerK = getKFactor(winnerMatchCount);
  const loserK = getKFactor(loserMatchCount);
  const kFactor = Math.round((winnerK + loserK) / 2);
  const kFactorLabel = getKFactorLabel(Math.min(winnerMatchCount, loserMatchCount));

  // 2. Expected Score (probabilité de victoire du gagnant)
  const expectedScore = calculateExpectedScore(winnerElo, loserElo);
  const winProbability = Math.round(expectedScore * 100);

  // 3. Coefficient de format
  const formatCoefficient = FORMAT_COEFFICIENTS[matchFormat];
  const formatLabel = matchFormat === 'one_set' ? '1 set' :
                      matchFormat === 'two_sets' ? '2 sets' :
                      matchFormat === 'three_sets' ? '3 sets' : 'Super TB';

  // 4. Modificateur marge de victoire
  const marginModifier = (winnerGames !== undefined && loserGames !== undefined)
    ? getMarginModifier(winnerGames, loserGames)
    : 1.0;
  const marginLabel = marginModifier >= 1.15 ? 'Victoire nette' :
                      marginModifier >= 1.05 ? 'Victoire claire' :
                      marginModifier <= 0.90 ? 'Match serré' : 'Standard';

  // 5. Bonus nouvel adversaire
  const newOpponentBonus = isNewOpponent ? ELO_CONFIG.NEW_OPPONENT_BONUS : 1.0;

  // 6. Bonus upset (victoire contre joueur +100 ELO)
  const isUpset = loserElo - winnerElo >= ELO_CONFIG.UPSET_THRESHOLD;
  const upsetBonus = isUpset ? ELO_CONFIG.UPSET_BONUS : 1.0;

  // 7. Malus répétition
  const repetitionMalus = Math.max(
    ELO_CONFIG.REPEAT_PENALTY_MIN,
    1 - (recentMatchesVsSameOpponent * ELO_CONFIG.REPEAT_PENALTY_PER_MATCH)
  );

  // 8. Bonus diversité hebdo
  const diversityBonus = weeklyUniqueOpponents >= ELO_CONFIG.DIVERSITY_THRESHOLD 
    ? ELO_CONFIG.DIVERSITY_BONUS 
    : 1.0;

  // Calcul brut (avant modificateurs)
  const rawChange = kFactor * (1 - expectedScore);

  // Calcul final avec tous les modificateurs
  const finalChange = Math.max(1, Math.round(
    rawChange *
    formatCoefficient *
    marginModifier *
    newOpponentBonus *
    upsetBonus *
    repetitionMalus *
    diversityBonus
  ));

  // Delta pour le perdant (ratio réduit)
  const loserDelta = -Math.round(finalChange * ELO_CONFIG.LOSER_RATIO);

  return {
    winnerDelta: finalChange,
    loserDelta,
    breakdown: {
      kFactor,
      kFactorLabel,
      expectedScore: Math.round(expectedScore * 100) / 100,
      winProbability,
      formatCoefficient,
      formatLabel,
      marginModifier: Math.round(marginModifier * 100) / 100,
      marginLabel,
      newOpponentBonus,
      upsetBonus,
      repetitionMalus: Math.round(repetitionMalus * 100) / 100,
      diversityBonus,
      rawChange: Math.round(rawChange),
      finalChange,
    },
  };
}

/**
 * Version simplifiée pour calcul rapide sans contexte
 */
export function calculateSimpleEloChange(
  winnerElo: number,
  loserElo: number,
  matchFormat: MatchFormat = 'two_sets'
): { winnerDelta: number; loserDelta: number } {
  const result = calculateEloChange({
    winnerElo,
    loserElo,
    winnerMatchCount: 30, // Assume établi
    loserMatchCount: 30,
    matchFormat,
  });
  
  return {
    winnerDelta: result.winnerDelta,
    loserDelta: result.loserDelta,
  };
}

// ============================================
// FONCTIONS LEGACY (compatibilité avec l'ancien système)
// ============================================

/**
 * Calcule le K-Factor dynamique (legacy export)
 */
export function calculateKFactor(matchesPlayed: number, currentElo: number): number {
  if (matchesPlayed < ELO_CONSTANTS.NEW_PLAYER_MATCHES) {
    return DEFAULT_ELO_CONFIG.kFactorNew;
  }
  if (matchesPlayed < ELO_CONSTANTS.INTERMEDIATE_PLAYER_MATCHES) {
    return DEFAULT_ELO_CONFIG.kFactorIntermediate;
  }
  if (currentElo >= ELO_CONSTANTS.HIGH_ELO_THRESHOLD) {
    return DEFAULT_ELO_CONFIG.kFactorHigh;
  }
  return DEFAULT_ELO_CONFIG.kFactorEstablished;
}

/**
 * Calcule le nouvel ELO après un match (legacy)
 */
export function calculateNewElo(
  currentElo: number,
  kFactor: number,
  expectedScore: number,
  actualScore: number,
  modifier: number = 1
): number {
  const delta = Math.round(kFactor * (actualScore - expectedScore) * modifier);
  const newElo = currentElo + delta;
  return Math.max(ELO_CONSTANTS.MIN_ELO, Math.min(ELO_CONSTANTS.MAX_ELO, newElo));
}

/**
 * Calcule le résultat complet ELO pour un match (legacy)
 */
export function calculateMatchElo(
  winner: PlayerForCalculation,
  loser: PlayerForCalculation,
  winnerHistory: MatchForCalculation[],
  loserHistory: MatchForCalculation[]
): MatchEloResult {
  // K-Factors
  const winnerK = calculateKFactor(winner.matchesPlayed, winner.currentElo);
  const loserK = calculateKFactor(loser.matchesPlayed, loser.currentElo);

  // Expected scores
  const winnerExpected = calculateExpectedScore(winner.currentElo, loser.currentElo);
  const loserExpected = 1 - winnerExpected;

  // Modifiers
  const winnerMods = calculateModifiers(
    winner.currentElo,
    loser.id,
    loser.currentElo,
    winnerHistory,
    true
  );
  const loserMods = calculateModifiers(
    loser.currentElo,
    winner.id,
    winner.currentElo,
    loserHistory,
    false
  );

  // New ELOs
  const winnerNewElo = calculateNewElo(
    winner.currentElo,
    winnerK,
    winnerExpected,
    1, // Actual score = 1 pour le gagnant
    winnerMods.totalModifier
  );
  const loserNewElo = calculateNewElo(
    loser.currentElo,
    loserK,
    loserExpected,
    0, // Actual score = 0 pour le perdant
    loserMods.totalModifier
  );

  return {
    winner: {
      eloBefore: winner.currentElo,
      eloAfter: winnerNewElo,
      delta: winnerNewElo - winner.currentElo,
      kFactor: winnerK,
      expectedScore: winnerExpected,
      actualScore: 1,
      modifiers: winnerMods,
    },
    loser: {
      eloBefore: loser.currentElo,
      eloAfter: loserNewElo,
      delta: loserNewElo - loser.currentElo,
      kFactor: loserK,
      expectedScore: loserExpected,
      actualScore: 0,
      modifiers: loserMods,
    },
  };
}

/**
 * Calcule la tendance ELO sur une période
 * Accepte soit des matchs avec date et ELO final, soit un historique avec deltas
 */
export function calculateEloTrend(
  history: { delta: number }[] | { playedAt: Date; eloAfter: number }[],
  days: number = 30
): 'up' | 'down' | 'stable' {
  // Si c'est un tableau de deltas simples
  if (history.length === 0) return 'stable';
  
  // Vérifier si c'est un historique avec deltas
  const firstItem = history[0];
  if (firstItem && 'delta' in firstItem && !('playedAt' in firstItem)) {
    // C'est un historique simple avec deltas
    const totalDelta = (history as { delta: number }[]).reduce((sum, h) => sum + h.delta, 0);
    if (totalDelta > 10) return 'up';
    if (totalDelta < -10) return 'down';
    return 'stable';
  }
  
  // C'est un format avec dates et ELO final
  const matchHistory = history as { playedAt: Date; eloAfter: number }[];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const recentMatches = matchHistory.filter(m => m.playedAt >= cutoff);
  if (recentMatches.length < 2) return 'stable';
  
  const sorted = [...recentMatches].sort((a, b) => 
    a.playedAt.getTime() - b.playedAt.getTime()
  );
  
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  if (!first || !last) return 'stable';
  
  const diff = last.eloAfter - first.eloAfter;
  if (diff > 10) return 'up';
  if (diff < -10) return 'down';
  return 'stable';
}

/**
 * Formate un delta ELO pour l'affichage
 */
export function formatEloDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

/**
 * Retourne la couleur associée à un delta ELO
 */
export function getEloDeltaColor(delta: number): string {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Retourne le titre de rang ELO
 */
export function getEloRankTitle(elo: number): { title: string; color: string; icon: string } {
  if (elo >= 2000) return { title: 'Grand Maître', color: 'text-purple-600', icon: '👑' };
  if (elo >= 1800) return { title: 'Expert', color: 'text-red-600', icon: '🏆' };
  if (elo >= 1600) return { title: 'Avancé', color: 'text-orange-500', icon: '⭐' };
  if (elo >= 1400) return { title: 'Intermédiaire+', color: 'text-yellow-600', icon: '🎯' };
  if (elo >= 1200) return { title: 'Intermédiaire', color: 'text-green-600', icon: '🎾' };
  if (elo >= 1000) return { title: 'Débutant+', color: 'text-blue-600', icon: '📈' };
  return { title: 'Débutant', color: 'text-gray-600', icon: '🌱' };
}
