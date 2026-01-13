/**
 * Trophy Case 2.0 - Système de Badges TennisMatchFinder
 * 
 * 16 badges répartis en 4 catégories avec système de tiers :
 * - Common (gris) : Badges faciles à obtenir
 * - Rare (bleu) : Requiert un effort modéré
 * - Epic (violet) : Accomplissements significatifs
 * - Legendary (or animé) : Exploits exceptionnels
 */

import type { BadgeTier, BadgeCategory } from '@/lib/db/schema';

// ============================================
// TYPES
// ============================================

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  criteria: string; // Description humaine pour l'UI
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string; // Nom icône Lucide
  iconColor?: string; // Couleur hex optionnelle
  sortOrder: number;
  isDynamic?: boolean; // true = peut être retiré (ex: King of Club)
  maxProgress?: number; // Pour badges progressifs
  // Fonction de vérification (nom symbolique)
  checkFunction?: string;
}

// ============================================
// DÉFINITION DES 16 BADGES
// ============================================

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ----------------------------------------
  // JALONS (Milestones) - 5 badges
  // ----------------------------------------
  {
    id: 'first-rally',
    name: 'First Rally',
    description: 'Premier match enregistré',
    criteria: 'Enregistrez votre premier match',
    category: 'milestone',
    tier: 'common',
    icon: 'Sparkles',
    iconColor: '#6B7280', // gray-500
    sortOrder: 1,
    maxProgress: 1,
    checkFunction: 'checkFirstMatch',
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: '10 matchs joués',
    criteria: 'Jouez 10 matchs',
    category: 'milestone',
    tier: 'common',
    icon: 'Target',
    iconColor: '#6B7280',
    sortOrder: 2,
    maxProgress: 10,
    checkFunction: 'checkMatchCount',
  },
  {
    id: 'regular',
    name: 'Habitué',
    description: '25 matchs joués',
    criteria: 'Jouez 25 matchs',
    category: 'milestone',
    tier: 'rare',
    icon: 'Activity',
    iconColor: '#3B82F6', // blue-500
    sortOrder: 3,
    maxProgress: 25,
    checkFunction: 'checkMatchCount',
  },
  {
    id: 'dedicated',
    name: 'Passionné',
    description: '50 matchs joués',
    criteria: 'Jouez 50 matchs',
    category: 'milestone',
    tier: 'epic',
    icon: 'Flame',
    iconColor: '#8B5CF6', // purple-500
    sortOrder: 4,
    maxProgress: 50,
    checkFunction: 'checkMatchCount',
  },
  {
    id: 'century',
    name: 'Century',
    description: '100 matchs joués - Légende !',
    criteria: 'Jouez 100 matchs',
    category: 'milestone',
    tier: 'legendary',
    icon: 'Trophy',
    iconColor: '#F59E0B', // amber-500
    sortOrder: 5,
    maxProgress: 100,
    checkFunction: 'checkMatchCount',
  },

  // ----------------------------------------
  // EXPLOITS (Achievements) - 4 badges
  // ----------------------------------------
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    description: '3 victoires consécutives',
    criteria: 'Gagnez 3 matchs d\'affilée',
    category: 'achievement',
    tier: 'rare',
    icon: 'Zap',
    iconColor: '#3B82F6',
    sortOrder: 10,
    maxProgress: 3,
    checkFunction: 'checkWinStreak',
  },
  {
    id: 'on-fire',
    name: 'On Fire',
    description: '5 victoires consécutives',
    criteria: 'Gagnez 5 matchs d\'affilée',
    category: 'achievement',
    tier: 'epic',
    icon: 'Flame',
    iconColor: '#EF4444', // red-500
    sortOrder: 11,
    maxProgress: 5,
    checkFunction: 'checkWinStreak',
  },
  {
    id: 'giant-killer',
    name: 'Giant Killer',
    description: 'Victoire contre un joueur +200 ELO',
    criteria: 'Battez un adversaire avec +200 ELO',
    category: 'achievement',
    tier: 'epic',
    icon: 'Sword',
    iconColor: '#8B5CF6',
    sortOrder: 12,
    checkFunction: 'checkGiantKiller',
  },
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: '+100 ELO en 30 jours',
    criteria: 'Progressez de 100 ELO en un mois',
    category: 'achievement',
    tier: 'rare',
    icon: 'TrendingUp',
    iconColor: '#10B981', // emerald-500
    sortOrder: 13,
    checkFunction: 'checkRisingStar',
  },

  // ----------------------------------------
  // SOCIAL - 4 badges
  // ----------------------------------------
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: '10 adversaires différents',
    criteria: 'Jouez contre 10 joueurs différents',
    category: 'social',
    tier: 'rare',
    icon: 'Users',
    iconColor: '#3B82F6',
    sortOrder: 20,
    maxProgress: 10,
    checkFunction: 'checkUniqueOpponents',
  },
  {
    id: 'club-pillar',
    name: 'Pilier du Club',
    description: '25 adversaires différents',
    criteria: 'Jouez contre 25 joueurs différents',
    category: 'social',
    tier: 'epic',
    icon: 'Building',
    iconColor: '#8B5CF6',
    sortOrder: 21,
    maxProgress: 25,
    checkFunction: 'checkUniqueOpponents',
  },
  {
    id: 'rival-master',
    name: 'Rival Master',
    description: '10 matchs vs même adversaire',
    criteria: 'Affrontez le même joueur 10 fois',
    category: 'social',
    tier: 'rare',
    icon: 'Swords',
    iconColor: '#F59E0B',
    sortOrder: 22,
    maxProgress: 10,
    checkFunction: 'checkRivalry',
  },
  {
    id: 'welcome-committee',
    name: 'Comité d\'accueil',
    description: 'Premier match de 5 nouveaux membres',
    criteria: 'Soyez le premier adversaire de 5 nouveaux',
    category: 'social',
    tier: 'common',
    icon: 'HandHeart',
    iconColor: '#EC4899', // pink-500
    sortOrder: 23,
    maxProgress: 5,
    checkFunction: 'checkWelcomeCommittee',
  },

  // ----------------------------------------
  // SPÉCIAL - 4 badges
  // ----------------------------------------
  {
    id: 'king-of-club',
    name: 'King of Club',
    description: '#1 ELO de ton club',
    criteria: 'Atteins la première place du classement',
    category: 'special',
    tier: 'legendary',
    icon: 'Crown',
    iconColor: '#F59E0B',
    sortOrder: 30,
    isDynamic: true, // Peut être perdu
    checkFunction: 'checkKingOfClub',
  },
  {
    id: 'founding-member',
    name: 'Founding Member',
    description: 'Membre depuis le début',
    criteria: 'Inscription pendant la phase Early Bird',
    category: 'special',
    tier: 'legendary',
    icon: 'Star',
    iconColor: '#F59E0B',
    sortOrder: 31,
    checkFunction: 'checkFoundingMember',
  },
  {
    id: 'tournament-victor',
    name: 'Champion',
    description: 'Vainqueur de tournoi',
    criteria: 'Remportez un tournoi',
    category: 'special',
    tier: 'epic',
    icon: 'Medal',
    iconColor: '#8B5CF6',
    sortOrder: 32,
    checkFunction: 'checkTournamentVictor',
  },
  {
    id: 'box-league-winner',
    name: 'Roi de la Poule',
    description: 'Vainqueur de Box League',
    criteria: 'Terminez premier de votre poule',
    category: 'special',
    tier: 'epic',
    icon: 'Award',
    iconColor: '#8B5CF6',
    sortOrder: 33,
    checkFunction: 'checkBoxLeagueWinner',
  },
];

// ============================================
// STYLE PAR TIER
// ============================================

export const TIER_STYLES: Record<BadgeTier, {
  bg: string;
  bgGradient: string;
  icon: string;
  glow: string;
  border: string;
  animation?: string;
}> = {
  common: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    bgGradient: 'bg-gray-100 dark:bg-gray-800',
    icon: 'text-gray-600 dark:text-gray-400',
    glow: '',
    border: 'border-gray-300 dark:border-gray-600',
  },
  rare: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    bgGradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
    icon: 'text-white',
    glow: 'shadow-lg shadow-blue-500/30',
    border: 'border-blue-400 dark:border-blue-500',
  },
  epic: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    bgGradient: 'bg-gradient-to-br from-purple-400 to-purple-600',
    icon: 'text-white',
    glow: 'shadow-lg shadow-purple-500/30',
    border: 'border-purple-400 dark:border-purple-500',
  },
  legendary: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    bgGradient: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500',
    icon: 'text-white',
    glow: 'shadow-lg shadow-yellow-500/40',
    border: 'border-amber-400 dark:border-amber-500',
    animation: 'animate-pulse-slow',
  },
};

// ============================================
// LABELS FRANÇAIS
// ============================================

export const TIER_LABELS: Record<BadgeTier, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

export const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  milestone: 'Jalons',
  achievement: 'Exploits',
  social: 'Social',
  special: 'Spécial',
};

export const CATEGORY_ICONS: Record<BadgeCategory, string> = {
  milestone: 'Flag',
  achievement: 'Medal',
  social: 'Users',
  special: 'Star',
};

// ============================================
// HELPERS
// ============================================

/**
 * Récupère un badge par son ID
 */
export function getBadgeById(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === badgeId);
}

/**
 * Récupère les badges par catégorie
 */
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Récupère les badges par tier
 */
export function getBadgesByTier(tier: BadgeTier): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.tier === tier)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Vérifie si un badge est dynamique (peut être retiré)
 */
export function isDynamicBadge(badgeId: string): boolean {
  const badge = getBadgeById(badgeId);
  return badge?.isDynamic ?? false;
}

/**
 * Vérifie si un badge est progressif
 */
export function isProgressiveBadge(badgeId: string): boolean {
  const badge = getBadgeById(badgeId);
  return (badge?.maxProgress ?? 0) > 1;
}

/**
 * Calcule le pourcentage de progression
 */
export function calculateProgressPercentage(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.round((current / max) * 100), 100);
}

// ============================================
// SEED DATA POUR LA BDD
// ============================================

export function getBadgeSeedData() {
  return BADGE_DEFINITIONS.map(badge => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    criteria: badge.criteria,
    category: badge.category,
    tier: badge.tier,
    icon: badge.icon,
    iconColor: badge.iconColor,
    sortOrder: badge.sortOrder,
    isActive: true,
    isDynamic: badge.isDynamic ?? false,
    maxProgress: badge.maxProgress ?? null,
  }));
}

// ============================================
// BACKWARDS COMPATIBILITY EXPORTS
// ============================================

/**
 * Alias BADGES pour rétrocompatibilité avec l'ancien code
 */
export const BADGES = BADGE_DEFINITIONS;

/**
 * Alias RARITY_LABELS pour rétrocompatibilité
 */
export const RARITY_LABELS = TIER_LABELS;

/**
 * Couleurs par rareté (ancien format)
 */
export const RARITY_COLORS: Record<BadgeTier, { bg: string; text: string; border: string }> = {
  common: {
    bg: TIER_STYLES.common.bg,
    text: 'text-gray-700 dark:text-gray-300',
    border: TIER_STYLES.common.border,
  },
  rare: {
    bg: TIER_STYLES.rare.bg,
    text: 'text-blue-700 dark:text-blue-300',
    border: TIER_STYLES.rare.border,
  },
  epic: {
    bg: TIER_STYLES.epic.bg,
    text: 'text-purple-700 dark:text-purple-300',
    border: TIER_STYLES.epic.border,
  },
  legendary: {
    bg: TIER_STYLES.legendary.bg,
    text: 'text-amber-700 dark:text-amber-300',
    border: TIER_STYLES.legendary.border,
  },
};

/**
 * Type Badge alias pour rétrocompatibilité
 */
export type Badge = BadgeDefinition;
