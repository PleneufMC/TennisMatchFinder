/**
 * Constantes ELO pour l'application
 */

// Niveaux ELO et leurs titres
export const ELO_TIERS = [
  { min: 2000, title: 'Grand Maître', color: 'purple', icon: '👑' },
  { min: 1800, title: 'Expert', color: 'red', icon: '🏆' },
  { min: 1600, title: 'Avancé', color: 'orange', icon: '⭐' },
  { min: 1400, title: 'Intermédiaire+', color: 'yellow', icon: '🎯' },
  { min: 1200, title: 'Intermédiaire', color: 'green', icon: '🎾' },
  { min: 1000, title: 'Débutant+', color: 'blue', icon: '📈' },
  { min: 0, title: 'Débutant', color: 'gray', icon: '🌱' },
] as const;

// Badges disponibles
export const BADGES = {
  explorer: {
    type: 'explorer',
    name: 'Explorateur',
    description: 'A joué contre 10 adversaires différents',
    icon: '🗺️',
    requirement: { uniqueOpponents: 10 },
  },
  explorer_pro: {
    type: 'explorer_pro',
    name: 'Grand Explorateur',
    description: 'A joué contre 25 adversaires différents',
    icon: '🧭',
    requirement: { uniqueOpponents: 25 },
  },
  giant_killer: {
    type: 'giant_killer',
    name: 'Tombeur de Géants',
    description: '3 victoires contre des joueurs +100 ELO',
    icon: '⚔️',
    requirement: { upsetWins: 3 },
  },
  streak_5: {
    type: 'streak_5',
    name: 'En Feu',
    description: 'Série de 5 victoires consécutives',
    icon: '🔥',
    requirement: { winStreak: 5 },
  },
  streak_10: {
    type: 'streak_10',
    name: 'Inarrêtable',
    description: 'Série de 10 victoires consécutives',
    icon: '💫',
    requirement: { winStreak: 10 },
  },
  veteran_50: {
    type: 'veteran_50',
    name: 'Vétéran',
    description: '50 matchs joués',
    icon: '🎖️',
    requirement: { matchesPlayed: 50 },
  },
  veteran_100: {
    type: 'veteran_100',
    name: 'Légende',
    description: '100 matchs joués',
    icon: '🏅',
    requirement: { matchesPlayed: 100 },
  },
  elo_1500: {
    type: 'elo_1500',
    name: 'Premier Sommet',
    description: 'A atteint 1500 ELO',
    icon: '⛰️',
    requirement: { bestElo: 1500 },
  },
  elo_1800: {
    type: 'elo_1800',
    name: 'Expert Confirmé',
    description: 'A atteint 1800 ELO',
    icon: '🏔️',
    requirement: { bestElo: 1800 },
  },
  elo_2000: {
    type: 'elo_2000',
    name: 'Grand Maître',
    description: 'A atteint 2000 ELO',
    icon: '🗻',
    requirement: { bestElo: 2000 },
  },
  diversity_weekly: {
    type: 'diversity_weekly',
    name: 'Touche-à-tout',
    description: '5 adversaires différents en une semaine',
    icon: '🌈',
    requirement: { weeklyDiversity: 5 },
  },
  first_match: {
    type: 'first_match',
    name: 'Premier Pas',
    description: 'A joué son premier match',
    icon: '👟',
    requirement: { matchesPlayed: 1 },
  },
  first_win: {
    type: 'first_win',
    name: 'Première Victoire',
    description: 'A remporté son premier match',
    icon: '🎉',
    requirement: { wins: 1 },
  },
} as const;

export type BadgeType = keyof typeof BADGES;

// Tendances ELO
export const ELO_TRENDS = {
  up: { icon: '↑', color: 'text-green-600', bgColor: 'bg-green-100' },
  down: { icon: '↓', color: 'text-red-600', bgColor: 'bg-red-100' },
  stable: { icon: '→', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  new: { icon: '★', color: 'text-blue-600', bgColor: 'bg-blue-100' },
} as const;

// Configuration des seuils pour les suggestions
export const SUGGESTION_CONFIG = {
  // Écart ELO idéal pour les suggestions
  IDEAL_ELO_GAP_MIN: 50,
  IDEAL_ELO_GAP_MAX: 150,
  MAX_ELO_GAP: 300,

  // Pondération des facteurs de compatibilité
  WEIGHTS: {
    eloProximity: 0.30,    // 30%
    noveltyScore: 0.35,    // 35%
    scheduleMatch: 0.20,   // 20%
    preferenceMatch: 0.15, // 15%
  },

  // Nombre de suggestions à afficher
  MAX_SUGGESTIONS: 5,

  // Jours d'inactivité avant exclusion des suggestions
  INACTIVE_DAYS_THRESHOLD: 30,
} as const;
