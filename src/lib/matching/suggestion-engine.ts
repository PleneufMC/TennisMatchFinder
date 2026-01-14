/**
 * Moteur de suggestions d'adversaires
 * Algorithme intelligent pour trouver les meilleurs adversaires
 */

import type { SuggestedPlayer, SuggestionTag } from '@/types';
import { SUGGESTION_CONFIG } from '@/constants/elo';

// Type simplifié pour le moteur de suggestions
export interface SuggestionPlayer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  current_elo: number;
  self_assessed_level?: string;
  availability?: unknown;
  preferences?: unknown;
  last_active_at?: string;
  matches_played?: number;
  created_at?: string;
}

export interface PlayerWithHistory extends SuggestionPlayer {
  matchHistory?: {
    opponentId: string;
    playedAt: string;
    winnerId: string | null;
  }[];
}

/**
 * Calcule le score de proximité ELO
 * Idéal: écart entre 50 et 150 points
 */
function calculateEloProximityScore(playerElo: number, opponentElo: number): number {
  const gap = Math.abs(playerElo - opponentElo);

  if (gap > SUGGESTION_CONFIG.MAX_ELO_GAP) {
    return 0;
  }

  if (gap >= SUGGESTION_CONFIG.IDEAL_ELO_GAP_MIN && gap <= SUGGESTION_CONFIG.IDEAL_ELO_GAP_MAX) {
    return 100;
  }

  if (gap < SUGGESTION_CONFIG.IDEAL_ELO_GAP_MIN) {
    // Trop proche, légère pénalité
    return 85 + (gap / SUGGESTION_CONFIG.IDEAL_ELO_GAP_MIN) * 15;
  }

  // Au-delà de l'idéal, décroissance linéaire
  const excess = gap - SUGGESTION_CONFIG.IDEAL_ELO_GAP_MAX;
  const maxExcess = SUGGESTION_CONFIG.MAX_ELO_GAP - SUGGESTION_CONFIG.IDEAL_ELO_GAP_MAX;
  return Math.max(0, 100 - (excess / maxExcess) * 100);
}

/**
 * Calcule le score de nouveauté
 * Plus le joueur est "nouveau" (jamais ou rarement affronté), plus le score est élevé
 */
function calculateNoveltyScore(
  opponentId: string,
  matchHistory: PlayerWithHistory['matchHistory']
): number {
  if (!matchHistory || matchHistory.length === 0) {
    return 100; // Aucun historique = score maximal
  }

  const matchesVsOpponent = matchHistory.filter((m) => m.opponentId === opponentId);

  if (matchesVsOpponent.length === 0) {
    return 100; // Jamais affronté = score maximal
  }

  // Pénalité basée sur le nombre de matchs récents
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentMatches = matchesVsOpponent.filter(
    (m) => new Date(m.playedAt) >= thirtyDaysAgo
  );

  if (recentMatches.length === 0) {
    return 70; // Pas de match récent = bon score
  }

  // Plus on a joué récemment, moins c'est intéressant
  return Math.max(20, 70 - recentMatches.length * 15);
}

/**
 * Calcule le score de compatibilité des disponibilités
 */
function calculateScheduleMatchScore(
  playerAvailability: unknown,
  opponentAvailability: unknown
): number {
  if (!playerAvailability || !opponentAvailability) {
    return 50; // Pas d'info = score neutre
  }

  const playerDays = (playerAvailability as { days?: string[] }).days || [];
  const playerSlots = (playerAvailability as { timeSlots?: string[] }).timeSlots || [];
  const opponentDays = (opponentAvailability as { days?: string[] }).days || [];
  const opponentSlots = (opponentAvailability as { timeSlots?: string[] }).timeSlots || [];

  // Jours en commun
  const commonDays = playerDays.filter((d) => opponentDays.includes(d));
  const daysScore = playerDays.length > 0 ? (commonDays.length / playerDays.length) * 100 : 50;

  // Créneaux en commun
  const commonSlots = playerSlots.filter((s) => opponentSlots.includes(s));
  const slotsScore = playerSlots.length > 0 ? (commonSlots.length / playerSlots.length) * 100 : 50;

  // Moyenne pondérée (jours plus importants que créneaux)
  return Math.round(daysScore * 0.6 + slotsScore * 0.4);
}

/**
 * Calcule le score de compatibilité des préférences
 */
function calculatePreferenceMatchScore(
  playerPreferences: unknown,
  opponentPreferences: unknown
): number {
  if (!playerPreferences || !opponentPreferences) {
    return 50;
  }

  const playerTypes = (playerPreferences as { gameTypes?: string[] }).gameTypes || [];
  const opponentTypes = (opponentPreferences as { gameTypes?: string[] }).gameTypes || [];

  // Types de jeu en commun
  const commonTypes = playerTypes.filter((t) => opponentTypes.includes(t));

  if (playerTypes.length === 0) {
    return 50;
  }

  return Math.round((commonTypes.length / playerTypes.length) * 100);
}

/**
 * Vérifie si un joueur est un nouveau membre (moins de 3 matchs et inscrit depuis moins de 30 jours)
 */
export function isNewMember(opponent: SuggestionPlayer): boolean {
  const matchesPlayed = opponent.matches_played ?? 0;
  const createdAt = opponent.created_at ? new Date(opponent.created_at) : null;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return matchesPlayed < 3 && createdAt !== null && createdAt >= thirtyDaysAgo;
}

/**
 * Génère les tags pour une suggestion
 */
function generateTags(
  playerElo: number,
  opponentElo: number,
  noveltyScore: number,
  opponent: SuggestionPlayer,
  matchHistory?: PlayerWithHistory['matchHistory']
): SuggestionTag[] {
  const tags: SuggestionTag[] = [];

  // Nouveau membre du club
  if (isNewMember(opponent)) {
    tags.push('Nouveau membre 👋');
  }

  // Nouvel adversaire
  if (noveltyScore === 100) {
    tags.push('Nouveau défi 🎯');
  }

  // Même niveau
  const eloGap = Math.abs(playerElo - opponentElo);
  if (eloGap <= 50) {
    tags.push('Même niveau 🎾');
  }

  // Revanche possible
  if (matchHistory && matchHistory.length > 0) {
    // Simplification: si le joueur a perdu récemment contre cet adversaire
    const recentLosses = matchHistory.filter(
      (m) => m.winnerId !== undefined && new Date(m.playedAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentLosses.length > 0) {
      tags.push('Revanche possible 🔥');
    }
  }

  return tags;
}

/**
 * Récupère les stats head-to-head entre deux joueurs
 */
function getHeadToHead(
  playerId: string,
  opponentId: string,
  matchHistory?: PlayerWithHistory['matchHistory']
): { wins: number; losses: number } | undefined {
  if (!matchHistory) return undefined;

  const matchesVsOpponent = matchHistory.filter((m) => m.opponentId === opponentId);

  if (matchesVsOpponent.length === 0) return undefined;

  const wins = matchesVsOpponent.filter((m) => m.winnerId === playerId).length;
  const losses = matchesVsOpponent.length - wins;

  return { wins, losses };
}

/**
 * Génère les suggestions d'adversaires pour un joueur
 */
export function generateSuggestions(
  currentPlayer: PlayerWithHistory,
  allPlayers: PlayerWithHistory[]
): SuggestedPlayer[] {
  const suggestions: SuggestedPlayer[] = [];

  // Filtrer les joueurs éligibles
  const eligiblePlayers = allPlayers.filter((p) => {
    // Exclure le joueur lui-même
    if (p.id === currentPlayer.id) return false;

    // Exclure les joueurs inactifs (pas de match depuis 30 jours)
    if (p.last_active_at) {
      const lastActive = new Date(p.last_active_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - SUGGESTION_CONFIG.INACTIVE_DAYS_THRESHOLD);
      if (lastActive < thirtyDaysAgo) return false;
    }

    // Exclure si écart ELO trop grand
    const eloGap = Math.abs(currentPlayer.current_elo - p.current_elo);
    if (eloGap > SUGGESTION_CONFIG.MAX_ELO_GAP) return false;

    return true;
  });

  // Calculer les scores pour chaque joueur
  for (const opponent of eligiblePlayers) {
    const eloProximity = calculateEloProximityScore(
      currentPlayer.current_elo,
      opponent.current_elo
    );
    const noveltyScore = calculateNoveltyScore(opponent.id, currentPlayer.matchHistory);
    const scheduleMatch = calculateScheduleMatchScore(
      currentPlayer.availability,
      opponent.availability
    );
    const preferenceMatch = calculatePreferenceMatchScore(
      currentPlayer.preferences,
      opponent.preferences
    );

    // Score de compatibilité global (pondéré)
    const compatibilityScore = Math.round(
      eloProximity * SUGGESTION_CONFIG.WEIGHTS.eloProximity +
        noveltyScore * SUGGESTION_CONFIG.WEIGHTS.noveltyScore +
        scheduleMatch * SUGGESTION_CONFIG.WEIGHTS.scheduleMatch +
        preferenceMatch * SUGGESTION_CONFIG.WEIGHTS.preferenceMatch
    );

    // Récupérer le dernier match entre les deux joueurs
    const matchesVsOpponent = currentPlayer.matchHistory?.filter(
      (m) => m.opponentId === opponent.id
    );
    const lastPlayed = matchesVsOpponent?.sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    )[0]?.playedAt;

    suggestions.push({
      player: {
        id: opponent.id,
        full_name: opponent.full_name,
        avatar_url: opponent.avatar_url,
        current_elo: opponent.current_elo,
        self_assessed_level: (opponent.self_assessed_level || 'intermédiaire') as 'débutant' | 'intermédiaire' | 'avancé' | 'expert',
        availability: opponent.availability,
        preferences: opponent.preferences,
      },
      compatibilityScore,
      factors: {
        eloProximity: Math.round(eloProximity),
        noveltyScore: Math.round(noveltyScore),
        scheduleMatch: Math.round(scheduleMatch),
        preferenceMatch: Math.round(preferenceMatch),
      },
      tags: generateTags(
        currentPlayer.current_elo,
        opponent.current_elo,
        noveltyScore,
        opponent,
        currentPlayer.matchHistory
      ),
      lastPlayed,
      headToHead: getHeadToHead(currentPlayer.id, opponent.id, currentPlayer.matchHistory),
      isNewMember: isNewMember(opponent),
    });
  }

  // Trier par score de compatibilité décroissant
  suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Retourner les X meilleures suggestions
  return suggestions.slice(0, SUGGESTION_CONFIG.MAX_SUGGESTIONS);
}
