/**
 * Calculateur ELO principal
 * Implémente la formule ELO avec les modificateurs innovants
 */

import {
  type EloConfig,
  type PlayerForCalculation,
  type MatchForCalculation,
  type EloChangeResult,
  type MatchEloResult,
  DEFAULT_ELO_CONFIG,
  ELO_CONSTANTS,
} from './types';
import { calculateModifiers } from './modifiers';

/**
 * Calcule le facteur K dynamique basé sur l'expérience et le niveau du joueur
 */
export function calculateKFactor(
  player: PlayerForCalculation,
  config: EloConfig = DEFAULT_ELO_CONFIG
): number {
  // Joueurs avec ELO élevé ont un K plus bas (plus stable)
  if (player.currentElo >= ELO_CONSTANTS.HIGH_ELO_THRESHOLD) {
    return config.kFactorHigh;
  }

  // Nouveaux joueurs ont un K plus élevé (ajustement rapide)
  if (player.matchesPlayed < ELO_CONSTANTS.NEW_PLAYER_MATCHES) {
    return config.kFactorNew;
  }

  // Joueurs intermédiaires
  if (player.matchesPlayed < ELO_CONSTANTS.INTERMEDIATE_PLAYER_MATCHES) {
    return config.kFactorIntermediate;
  }

  // Joueurs établis
  return config.kFactorEstablished;
}

/**
 * Calcule le score attendu (probabilité de victoire)
 * Basé sur la formule standard ELO
 */
export function calculateExpectedScore(
  playerElo: number,
  opponentElo: number
): number {
  const exponent = (opponentElo - playerElo) / ELO_CONSTANTS.ELO_DIVISOR;
  return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Calcule le nouveau ELO après un match
 * Formule: NouvelELO = AncienELO + K × Modificateurs × (Résultat - Attendu)
 */
export function calculateNewElo(
  currentElo: number,
  kFactor: number,
  expectedScore: number,
  actualScore: number, // 1 pour victoire, 0 pour défaite
  modifier: number
): number {
  const delta = kFactor * modifier * (actualScore - expectedScore);
  const newElo = currentElo + delta;

  // Limiter l'ELO dans les bornes
  return Math.round(
    Math.max(ELO_CONSTANTS.MIN_ELO, Math.min(ELO_CONSTANTS.MAX_ELO, newElo))
  );
}

/**
 * Calcule le changement ELO complet pour un match
 */
export function calculateMatchElo(
  winner: PlayerForCalculation,
  loser: PlayerForCalculation,
  winnerMatchHistory: MatchForCalculation[],
  loserMatchHistory: MatchForCalculation[],
  config: EloConfig = DEFAULT_ELO_CONFIG
): MatchEloResult {
  // Calcul des facteurs K
  const winnerK = calculateKFactor(winner, config);
  const loserK = calculateKFactor(loser, config);

  // Calcul des scores attendus
  const winnerExpected = calculateExpectedScore(winner.currentElo, loser.currentElo);
  const loserExpected = calculateExpectedScore(loser.currentElo, winner.currentElo);

  // Calcul des modificateurs
  const winnerModifiers = calculateModifiers(
    winner.currentElo,
    loser.id,
    loser.currentElo,
    winnerMatchHistory,
    true // isWinner
  );

  const loserModifiers = calculateModifiers(
    loser.currentElo,
    winner.id,
    winner.currentElo,
    loserMatchHistory,
    false // isWinner
  );

  // Calcul des nouveaux ELO
  const winnerNewElo = calculateNewElo(
    winner.currentElo,
    winnerK,
    winnerExpected,
    1, // Victoire
    winnerModifiers.totalModifier
  );

  const loserNewElo = calculateNewElo(
    loser.currentElo,
    loserK,
    loserExpected,
    0, // Défaite
    loserModifiers.totalModifier
  );

  return {
    winner: {
      eloBefore: winner.currentElo,
      eloAfter: winnerNewElo,
      delta: winnerNewElo - winner.currentElo,
      kFactor: winnerK,
      expectedScore: winnerExpected,
      actualScore: 1,
      modifiers: winnerModifiers,
    },
    loser: {
      eloBefore: loser.currentElo,
      eloAfter: loserNewElo,
      delta: loserNewElo - loser.currentElo,
      kFactor: loserK,
      expectedScore: loserExpected,
      actualScore: 0,
      modifiers: loserModifiers,
    },
  };
}

/**
 * Simule un match pour prévisualisation (sans modifier la BDD)
 * Utile pour montrer les gains/pertes potentiels avant un match
 */
export function simulateMatch(
  player1: PlayerForCalculation,
  player2: PlayerForCalculation,
  player1History: MatchForCalculation[],
  player2History: MatchForCalculation[],
  config: EloConfig = DEFAULT_ELO_CONFIG
): {
  ifPlayer1Wins: MatchEloResult;
  ifPlayer2Wins: MatchEloResult;
  player1WinProbability: number;
} {
  const player1WinProbability = calculateExpectedScore(
    player1.currentElo,
    player2.currentElo
  );

  return {
    ifPlayer1Wins: calculateMatchElo(
      player1,
      player2,
      player1History,
      player2History,
      config
    ),
    ifPlayer2Wins: calculateMatchElo(
      player2,
      player1,
      player2History,
      player1History,
      config
    ),
    player1WinProbability: Math.round(player1WinProbability * 100),
  };
}

/**
 * Formate le delta ELO pour l'affichage
 */
export function formatEloDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }
  return delta.toString();
}

/**
 * Retourne la couleur CSS pour un delta ELO
 */
export function getEloDeltaColor(delta: number): string {
  if (delta > 0) {
    return 'text-green-600';
  }
  if (delta < 0) {
    return 'text-red-600';
  }
  return 'text-gray-600';
}

/**
 * Calcule la tendance ELO sur les X derniers matchs
 */
export function calculateEloTrend(
  history: { delta: number }[],
  matchCount: number = 5
): 'up' | 'down' | 'stable' {
  const recent = history.slice(0, matchCount);
  if (recent.length === 0) {
    return 'stable';
  }

  const totalDelta = recent.reduce((sum, h) => sum + h.delta, 0);

  if (totalDelta > 10) {
    return 'up';
  }
  if (totalDelta < -10) {
    return 'down';
  }
  return 'stable';
}

/**
 * Génère un rang textuel basé sur l'ELO
 */
export function getEloRankTitle(elo: number): {
  title: string;
  color: string;
  icon: string;
} {
  if (elo >= 2000) {
    return { title: 'Grand Maître', color: 'text-purple-600', icon: '👑' };
  }
  if (elo >= 1800) {
    return { title: 'Expert', color: 'text-red-600', icon: '🏆' };
  }
  if (elo >= 1600) {
    return { title: 'Avancé', color: 'text-orange-500', icon: '⭐' };
  }
  if (elo >= 1400) {
    return { title: 'Intermédiaire+', color: 'text-yellow-600', icon: '🎯' };
  }
  if (elo >= 1200) {
    return { title: 'Intermédiaire', color: 'text-green-600', icon: '🎾' };
  }
  if (elo >= 1000) {
    return { title: 'Débutant+', color: 'text-blue-600', icon: '📈' };
  }
  return { title: 'Débutant', color: 'text-gray-600', icon: '🌱' };
}
