/**
 * Système de badges TennisMatchFinder
 * 
 * 16 badges répartis en 4 catégories :
 * - Jalons (milestones) : Progression dans l'utilisation
 * - Exploits (achievements) : Performances exceptionnelles
 * - Social : Engagement communautaire
 * - Spécial : Événements et statuts uniques
 */

// Types pour les badges
export type BadgeCategory = 'milestone' | 'achievement' | 'social' | 'special';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: string; // Description humaine de la condition
  checkFunction?: string; // Nom de la fonction de vérification
}

// ============================================
// DÉFINITION DES 15 BADGES
// ============================================

export const BADGES: Badge[] = [
  // --- JALONS (5 badges) ---
  {
    id: 'first_match',
    name: 'Premier Set',
    description: 'Enregistrez votre premier match',
    icon: 'Sparkles',
    category: 'milestone',
    rarity: 'common',
    condition: 'matchesPlayed >= 1',
  },
  {
    id: 'match_10',
    name: 'Joueur Régulier',
    description: 'Jouez 10 matchs',
    icon: 'Target',
    category: 'milestone',
    rarity: 'common',
    condition: 'matchesPlayed >= 10',
  },
  {
    id: 'match_50',
    name: 'Compétiteur',
    description: 'Jouez 50 matchs',
    icon: 'Flame',
    category: 'milestone',
    rarity: 'rare',
    condition: 'matchesPlayed >= 50',
  },
  {
    id: 'match_100',
    name: 'Centenaire',
    description: 'Atteignez 100 matchs joués',
    icon: 'Trophy',
    category: 'milestone',
    rarity: 'epic',
    condition: 'matchesPlayed >= 100',
  },
  {
    id: 'elo_1400',
    name: 'Rising Star',
    description: 'Atteignez 1400 ELO',
    icon: 'TrendingUp',
    category: 'milestone',
    rarity: 'rare',
    condition: 'currentElo >= 1400',
  },

  // --- EXPLOITS (5 badges) ---
  {
    id: 'giant_slayer',
    name: 'Giant Slayer',
    description: 'Battez un joueur avec 200+ ELO de plus que vous',
    icon: 'Sword',
    category: 'achievement',
    rarity: 'epic',
    condition: 'Victoire contre adversaire +200 ELO',
  },
  {
    id: 'win_streak_5',
    name: 'En Feu',
    description: 'Gagnez 5 matchs consécutifs',
    icon: 'Zap',
    category: 'achievement',
    rarity: 'rare',
    condition: 'winStreak >= 5',
  },
  {
    id: 'win_streak_10',
    name: 'Inarrêtable',
    description: 'Gagnez 10 matchs consécutifs',
    icon: 'Rocket',
    category: 'achievement',
    rarity: 'legendary',
    condition: 'winStreak >= 10',
  },
  {
    id: 'perfect_month',
    name: 'Mois Parfait',
    description: 'Gagnez tous vos matchs d\'un mois (min. 4 matchs)',
    icon: 'CalendarCheck',
    category: 'achievement',
    rarity: 'legendary',
    condition: '100% victoires sur 1 mois (min 4 matchs)',
  },
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Remontez 100+ points ELO en 30 jours',
    icon: 'ArrowBigUp',
    category: 'achievement',
    rarity: 'epic',
    condition: '+100 ELO en 30 jours',
  },

  // --- SOCIAL (3 badges) ---
  {
    id: 'social_butterfly',
    name: 'Papillon Social',
    description: 'Jouez contre 10 adversaires différents',
    icon: 'Users',
    category: 'social',
    rarity: 'common',
    condition: 'uniqueOpponents >= 10',
  },
  {
    id: 'networking_pro',
    name: 'Networking Pro',
    description: 'Jouez contre 25 adversaires différents',
    icon: 'Network',
    category: 'social',
    rarity: 'rare',
    condition: 'uniqueOpponents >= 25',
  },
  {
    id: 'club_legend',
    name: 'Légende du Club',
    description: 'Jouez contre 50 adversaires différents',
    icon: 'Star',
    category: 'social',
    rarity: 'epic',
    condition: 'uniqueOpponents >= 50',
  },

  // --- SPÉCIAL (3 badges) ---
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Membre depuis la phase de lancement',
    icon: 'Bird',
    category: 'special',
    rarity: 'legendary',
    condition: 'Inscription avant le 30 juin 2026',
  },
  {
    id: 'king_of_club',
    name: 'King of Club',
    description: 'Tu es #1 ELO de ton club !',
    icon: 'Crown',
    category: 'special',
    rarity: 'legendary',
    condition: 'Classement #1 du club',
    // BADGE DYNAMIQUE : peut être retiré si quelqu'un te dépasse
  },
  {
    id: 'club_regular',
    name: 'Club Regular',
    description: 'Membre le plus actif du club sur les 90 derniers jours',
    icon: 'Calendar',
    category: 'special',
    rarity: 'epic',
    condition: 'Plus de matchs joués sur 90 jours que tout autre membre',
  },
];

// Badge dynamique - peut être perdu
export const DYNAMIC_BADGES = ['king_of_club'] as const;

/**
 * Vérifie si un badge est dynamique (peut être retiré)
 */
export function isDynamicBadge(badgeId: string): boolean {
  return DYNAMIC_BADGES.includes(badgeId as typeof DYNAMIC_BADGES[number]);
}

// ============================================
// HELPERS
// ============================================

/**
 * Récupère un badge par son ID
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find((b) => b.id === badgeId);
}

/**
 * Récupère les badges par catégorie
 */
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return BADGES.filter((b) => b.category === category);
}

/**
 * Récupère les badges par rareté
 */
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
  return BADGES.filter((b) => b.rarity === rarity);
}

/**
 * Couleurs associées aux raretés
 */
export const RARITY_COLORS: Record<BadgeRarity, { bg: string; text: string; border: string }> = {
  common: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
  rare: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
  },
  epic: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-400 dark:border-amber-500',
  },
};

/**
 * Labels français des catégories
 */
export const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  milestone: 'Jalons',
  achievement: 'Exploits',
  social: 'Social',
  special: 'Spécial',
};

/**
 * Labels français des raretés
 */
export const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};
