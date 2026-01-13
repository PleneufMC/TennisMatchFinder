/**
 * Coefficients de pondération ELO par format de match
 * 
 * Justification :
 * - 1 set = haute variance statistique, le meilleur joueur peut facilement perdre
 * - 2 sets = format amateur standard, signal fiable
 * - 3 sets = match complet, impact maximal
 * - Super tie-break = quasi-aléatoire, impact minimal
 * 
 * C'est un USP majeur vs Playtomic (frustration #1 = rating imprécis)
 */

export const MATCH_FORMATS = ['one_set', 'two_sets', 'three_sets', 'super_tiebreak'] as const;
export type MatchFormat = typeof MATCH_FORMATS[number];

export const FORMAT_COEFFICIENTS: Record<MatchFormat, number> = {
  one_set: 0.5,
  two_sets: 0.8,
  three_sets: 1.0,
  super_tiebreak: 0.3,
} as const;

export const FORMAT_LABELS: Record<MatchFormat, string> = {
  one_set: '1 set',
  two_sets: '2 sets gagnants',
  three_sets: '3 sets',
  super_tiebreak: 'Super tie-break',
} as const;

export const FORMAT_DESCRIPTIONS: Record<MatchFormat, string> = {
  one_set: 'Match rapide, pause déjeuner',
  two_sets: 'Format amateur standard',
  three_sets: 'Match complet, tournois',
  super_tiebreak: '3ème set raccourci',
} as const;

/**
 * Calcule le modificateur basé sur la marge de victoire
 * Applicable principalement aux matchs en 1 set pour différencier 6-0 de 7-6
 * 
 * @param winnerGames - Total de jeux gagnés par le vainqueur
 * @param loserGames - Total de jeux gagnés par le perdant
 * @returns Modificateur entre 0.90 et 1.15
 */
export function getMarginModifier(winnerGames: number, loserGames: number): number {
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
 */
export function parseScoreForGames(score: string, winnerId: string, player1Id: string): { winnerGames: number; loserGames: number } {
  const isPlayer1Winner = winnerId === player1Id;
  let player1Games = 0;
  let player2Games = 0;

  // Parse chaque set (format: "6-4 6-3" ou "6-4, 6-3")
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
  
  // Vérifier si super tie-break (format "10-8" ou similaire dans le dernier set)
  if (sets.length > 0) {
    const lastSet = sets[sets.length - 1];
    if (lastSet) {
      const parts = lastSet.split('-').map(Number);
      const games1 = parts[0];
      const games2 = parts[1];
      if (games1 !== undefined && games2 !== undefined && (games1 >= 10 || games2 >= 10)) {
        return 'super_tiebreak';
      }
    }
  }
  
  if (sets.length === 1) return 'one_set';
  if (sets.length === 2) return 'two_sets';
  if (sets.length >= 3) return 'three_sets';
  
  return 'two_sets'; // Default
}
