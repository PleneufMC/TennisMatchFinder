/**
 * Coefficients de pondération ELO par format de match
 * 
 * Justification :
 * - 1 set = haute variance statistique, le meilleur joueur peut facilement perdre
 * - 2 sets gagnants = format amateur standard, signal fiable
 * - 2 sets + Super TB = format avec tie-break décisif au 3ème set (10 pts)
 * - 3 sets = match complet, impact maximal
 * - Super tie-break seul = match en 10 points uniquement, très court/aléatoire
 * 
 * C'est un USP majeur vs Playtomic (frustration #1 = rating imprécis)
 */

export const MATCH_FORMATS = [
  'one_set', 
  'two_sets', 
  'two_sets_super_tb',  // 2 sets gagnants avec Super TB au 3ème
  'three_sets', 
  'super_tiebreak'      // Match en Super TB uniquement (10 pts)
] as const;

export type MatchFormat = typeof MATCH_FORMATS[number];

export const FORMAT_COEFFICIENTS: Record<MatchFormat, number> = {
  one_set: 0.5,
  two_sets: 0.8,
  two_sets_super_tb: 0.85,  // Légèrement plus qu'un 2 sets classique (3ème set joué)
  three_sets: 1.0,
  super_tiebreak: 0.3,      // Match en 10 points = très aléatoire
} as const;

export const FORMAT_LABELS: Record<MatchFormat, string> = {
  one_set: '1 set',
  two_sets: '2 sets gagnants',
  two_sets_super_tb: '2 sets + Super TB',
  three_sets: '3 sets',
  super_tiebreak: 'Super Tie-Break (10 pts)',
} as const;

export const FORMAT_DESCRIPTIONS: Record<MatchFormat, string> = {
  one_set: 'Match rapide, pause déjeuner',
  two_sets: 'Format amateur standard',
  two_sets_super_tb: 'Super TB au 3ème set si 1-1',
  three_sets: 'Match complet, tournois',
  super_tiebreak: 'Match en 10 points uniquement',
} as const;

/**
 * Ordre d'affichage dans le sélecteur UI
 */
export const FORMAT_DISPLAY_ORDER: MatchFormat[] = [
  'one_set',
  'two_sets',
  'two_sets_super_tb',
  'three_sets',
  'super_tiebreak',
];

/**
 * Calcule le modificateur basé sur la marge de victoire
 * Applicable principalement aux matchs en sets pour différencier 6-0 de 7-6
 * 
 * @param winnerGames - Total de jeux gagnés par le vainqueur
 * @param loserGames - Total de jeux gagnés par le perdant
 * @param format - Format du match (différent calcul pour super_tiebreak)
 * @returns Modificateur entre 0.90 et 1.15
 */
export function getMarginModifier(
  winnerGames: number, 
  loserGames: number,
  format?: MatchFormat
): number {
  // Pour un Super TB seul, la marge est basée sur les points
  if (format === 'super_tiebreak') {
    const margin = winnerGames - loserGames;
    if (margin >= 5) return 1.10;   // 10-5 ou mieux = victoire nette
    if (margin >= 3) return 1.05;   // 10-7 = victoire claire
    if (margin <= 2) return 0.95;   // 10-8 = très serré
    return 1.0;
  }
  
  // Pour les matchs en sets
  const margin = winnerGames - loserGames;
  
  if (margin >= 5) return 1.15;  // 6-1, 6-0 → victoire nette
  if (margin >= 3) return 1.05;  // 6-3, 6-2 → victoire claire
  if (margin <= 1) return 0.90;  // 7-6, 7-5 → match serré (haute variance)
  
  return 1.0; // 6-4 → neutre
}

/**
 * Labels pour les modificateurs de marge
 */
export function getMarginLabel(modifier: number): string {
  if (modifier >= 1.15) return 'Victoire nette';
  if (modifier >= 1.05) return 'Victoire claire';
  if (modifier <= 0.90) return 'Match serré';
  return 'Standard';
}

/**
 * Valide qu'un format est valide
 */
export function isValidMatchFormat(format: string): format is MatchFormat {
  return MATCH_FORMATS.includes(format as MatchFormat);
}

/**
 * Parse un score string pour extraire les jeux totaux
 * Exemples: "6-4 6-3" → { winner: 12, loser: 7 }
 *           "6-4 3-6 6-2" → { winner: 15, loser: 12 }
 *           "10-7" (super TB) → { winner: 10, loser: 7 }
 */
export function parseScoreForGames(
  score: string, 
  winnerId: string, 
  player1Id: string
): { winnerGames: number; loserGames: number } {
  const isPlayer1Winner = winnerId === player1Id;
  let player1Games = 0;
  let player2Games = 0;

  // Parse chaque set (format: "6-4 6-3" ou "6-4, 6-3" ou "10-7")
  const sets = score.replace(/,/g, ' ').split(/\s+/).filter(s => s.includes('-'));
  
  for (const set of sets) {
    const parts = set.split('-').map(Number);
    const games1 = parts[0];
    const games2 = parts[1];
    if (games1 !== undefined && games2 !== undefined && !isNaN(games1) && !isNaN(games2)) {
      player1Games += games1;
      player2Games += games2;
    }
  }

  return {
    winnerGames: isPlayer1Winner ? player1Games : player2Games,
    loserGames: isPlayer1Winner ? player2Games : player1Games,
  };
}

/**
 * Détermine le format probable basé sur le score
 */
export function inferFormatFromScore(score: string): MatchFormat {
  const sets = score.replace(/,/g, ' ').split(/\s+/).filter(s => s.includes('-'));
  
  // Un seul score et c'est un Super TB (10-X ou X-10)
  if (sets.length === 1) {
    const parts = sets[0]?.split('-').map(Number);
    const games1 = parts?.[0];
    const games2 = parts?.[1];
    
    // Super TB seul : 10-X, 11-9, 12-10, etc.
    if (games1 !== undefined && games2 !== undefined) {
      if ((games1 >= 10 || games2 >= 10) && Math.abs(games1 - games2) <= 2) {
        return 'super_tiebreak';
      }
    }
    
    // Sinon c'est un match en 1 set
    return 'one_set';
  }
  
  // Vérifier si le dernier "set" est un Super TB (2 sets + Super TB au 3ème)
  if (sets.length === 3) {
    const lastSet = sets[2];
    if (lastSet) {
      const parts = lastSet.split('-').map(Number);
      const games1 = parts[0];
      const games2 = parts[1];
      
      // Si le 3ème set ressemble à un Super TB (10+ points, écart ≤ 2)
      if (games1 !== undefined && games2 !== undefined) {
        if ((games1 >= 10 || games2 >= 10) && Math.abs(games1 - games2) <= 2) {
          return 'two_sets_super_tb';
        }
      }
    }
    // Sinon c'est un vrai 3 sets
    return 'three_sets';
  }
  
  if (sets.length === 2) return 'two_sets';
  if (sets.length >= 3) return 'three_sets';
  
  return 'two_sets'; // Default
}

/**
 * Vérifie si un score est valide pour un Super TB seul
 * Format attendu: "10-X" où le gagnant a au moins 10 pts et 2 pts d'écart
 */
export function isValidSuperTiebreakScore(score: string): boolean {
  const trimmed = score.trim();
  const parts = trimmed.split('-').map(Number);
  
  if (parts.length !== 2) return false;
  
  const [score1, score2] = parts;
  if (score1 === undefined || score2 === undefined) return false;
  if (isNaN(score1) || isNaN(score2)) return false;
  
  const winner = Math.max(score1, score2);
  const loser = Math.min(score1, score2);
  
  // Le gagnant doit avoir au moins 10 points
  if (winner < 10) return false;
  
  // Il doit y avoir au moins 2 points d'écart
  if (winner - loser < 2) return false;
  
  // Si c'est exactement 10, le perdant doit avoir 8 ou moins
  if (winner === 10 && loser > 8) return false;
  
  return true;
}
