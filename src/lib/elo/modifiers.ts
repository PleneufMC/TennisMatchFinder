/**
 * Calcul des modificateurs ELO
 * Innovation clé de TennisMatchFinder pour favoriser la diversité des rencontres
 */

import type {
  MatchForCalculation,
  ModifiersResult,
  ModifierDetail,
  ModifierType,
} from './types';

/**
 * Configuration des modificateurs
 */
const MODIFIER_CONFIG = {
  // Bonus nouvel adversaire : +15%
  NEW_OPPONENT_BONUS: 1.15,

  // Malus répétition : -5% par match dans les 30 derniers jours
  REPETITION_PENALTY_PER_MATCH: 0.05,
  REPETITION_MIN_MODIFIER: 0.70, // Minimum 70% des points
  REPETITION_WINDOW_DAYS: 30,

  // Bonus exploit (upset) : +20% si victoire contre +100 ELO
  UPSET_BONUS: 1.20,
  UPSET_ELO_THRESHOLD: 100,

  // Bonus diversité hebdomadaire : +10% si 3+ adversaires différents cette semaine
  WEEKLY_DIVERSITY_BONUS: 1.10,
  WEEKLY_DIVERSITY_MIN_OPPONENTS: 3,
  WEEKLY_WINDOW_DAYS: 7,
} as const;

/**
 * Vérifie si une date est dans les X derniers jours
 */
function isWithinDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

/**
 * Calcule le bonus pour un nouvel adversaire
 */
function calculateNewOpponentBonus(
  opponentId: string,
  matchHistory: MatchForCalculation[]
): ModifierDetail | null {
  const hasPlayedBefore = matchHistory.some(
    (match) => match.opponentId === opponentId
  );

  if (!hasPlayedBefore) {
    return {
      type: 'new_opponent',
      value: MODIFIER_CONFIG.NEW_OPPONENT_BONUS,
      description: 'Bonus nouvel adversaire (+15%)',
    };
  }

  return null;
}

/**
 * Calcule le malus pour les adversaires répétés
 */
function calculateRepetitionPenalty(
  opponentId: string,
  matchHistory: MatchForCalculation[]
): ModifierDetail | null {
  const recentMatches = matchHistory.filter(
    (match) =>
      match.opponentId === opponentId &&
      isWithinDays(match.playedAt, MODIFIER_CONFIG.REPETITION_WINDOW_DAYS)
  );

  if (recentMatches.length === 0) {
    return null;
  }

  const penaltyValue = Math.max(
    MODIFIER_CONFIG.REPETITION_MIN_MODIFIER,
    1 - recentMatches.length * MODIFIER_CONFIG.REPETITION_PENALTY_PER_MATCH
  );

  if (penaltyValue < 1) {
    const penaltyPercent = Math.round((1 - penaltyValue) * 100);
    return {
      type: 'repetition',
      value: penaltyValue,
      description: `Malus adversaire répété (-${penaltyPercent}%, ${recentMatches.length} match${recentMatches.length > 1 ? 's' : ''} récent${recentMatches.length > 1 ? 's' : ''})`,
    };
  }

  return null;
}

/**
 * Calcule le bonus pour une victoire upset (contre un joueur mieux classé)
 */
function calculateUpsetBonus(
  playerElo: number,
  opponentElo: number,
  isWinner: boolean
): ModifierDetail | null {
  if (!isWinner) {
    return null;
  }

  const eloDiff = opponentElo - playerElo;

  if (eloDiff >= MODIFIER_CONFIG.UPSET_ELO_THRESHOLD) {
    return {
      type: 'upset',
      value: MODIFIER_CONFIG.UPSET_BONUS,
      description: `Bonus exploit (+20%, victoire contre +${eloDiff} ELO)`,
    };
  }

  return null;
}

/**
 * Calcule le bonus pour la diversité hebdomadaire
 */
function calculateWeeklyDiversityBonus(
  matchHistory: MatchForCalculation[]
): ModifierDetail | null {
  const weeklyOpponents = new Set(
    matchHistory
      .filter((match) =>
        isWithinDays(match.playedAt, MODIFIER_CONFIG.WEEKLY_WINDOW_DAYS)
      )
      .map((match) => match.opponentId)
  );

  if (weeklyOpponents.size >= MODIFIER_CONFIG.WEEKLY_DIVERSITY_MIN_OPPONENTS) {
    return {
      type: 'weekly_diversity',
      value: MODIFIER_CONFIG.WEEKLY_DIVERSITY_BONUS,
      description: `Bonus diversité hebdo (+10%, ${weeklyOpponents.size} adversaires cette semaine)`,
    };
  }

  return null;
}

/**
 * Calcule tous les modificateurs pour un joueur
 */
export function calculateModifiers(
  playerElo: number,
  opponentId: string,
  opponentElo: number,
  matchHistory: MatchForCalculation[],
  isWinner: boolean
): ModifiersResult {
  const details: ModifierDetail[] = [];
  let totalModifier = 1.0;

  // 1. Bonus nouvel adversaire
  const newOpponentBonus = calculateNewOpponentBonus(opponentId, matchHistory);
  if (newOpponentBonus) {
    details.push(newOpponentBonus);
    totalModifier *= newOpponentBonus.value;
  }

  // 2. Malus répétition (si pas nouvel adversaire)
  if (!newOpponentBonus) {
    const repetitionPenalty = calculateRepetitionPenalty(
      opponentId,
      matchHistory
    );
    if (repetitionPenalty) {
      details.push(repetitionPenalty);
      totalModifier *= repetitionPenalty.value;
    }
  }

  // 3. Bonus upset (uniquement pour le gagnant)
  const upsetBonus = calculateUpsetBonus(playerElo, opponentElo, isWinner);
  if (upsetBonus) {
    details.push(upsetBonus);
    totalModifier *= upsetBonus.value;
  }

  // 4. Bonus diversité hebdomadaire
  const diversityBonus = calculateWeeklyDiversityBonus(matchHistory);
  if (diversityBonus) {
    details.push(diversityBonus);
    totalModifier *= diversityBonus.value;
  }

  return {
    totalModifier: Math.round(totalModifier * 100) / 100, // Arrondi à 2 décimales
    details,
  };
}

/**
 * Formate les modificateurs pour l'affichage
 */
export function formatModifiers(modifiers: ModifiersResult): string {
  if (modifiers.details.length === 0) {
    return 'Aucun modificateur appliqué';
  }

  return modifiers.details.map((d) => d.description).join(', ');
}

/**
 * Retourne la couleur associée à un type de modificateur
 */
export function getModifierColor(type: ModifierType): string {
  switch (type) {
    case 'new_opponent':
      return 'text-blue-600';
    case 'repetition':
      return 'text-orange-600';
    case 'upset':
      return 'text-purple-600';
    case 'weekly_diversity':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Retourne l'icône associée à un type de modificateur
 */
export function getModifierIcon(type: ModifierType): string {
  switch (type) {
    case 'new_opponent':
      return '🎯';
    case 'repetition':
      return '🔄';
    case 'upset':
      return '🏆';
    case 'weekly_diversity':
      return '🌟';
    default:
      return '📊';
  }
}
