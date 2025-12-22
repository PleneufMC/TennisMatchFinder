/**
 * Utilitaires de formatage
 */

/**
 * Formate un nombre avec des séparateurs de milliers
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Formate un pourcentage
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formate un ratio (ex: victoires/défaites)
 */
export function formatRatio(wins: number, losses: number): string {
  if (losses === 0) {
    return wins > 0 ? '∞' : '-';
  }
  return (wins / losses).toFixed(2);
}

/**
 * Calcule et formate le taux de victoire
 */
export function formatWinRate(wins: number, total: number): string {
  if (total === 0) {
    return '-';
  }
  return formatPercent((wins / total) * 100, 1);
}

/**
 * Formate le delta ELO avec signe
 */
export function formatEloDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }
  return delta.toString();
}

/**
 * Tronque un texte avec ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Capitalise la première lettre
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Capitalise chaque mot
 */
export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Génère les initiales d'un nom
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Génère un slug URL-friendly
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Formate un score de match (ajoute des espaces)
 */
export function formatScore(score: string): string {
  return score.split(' ').join('  ');
}

/**
 * Parse le score et retourne le gagnant
 */
export function parseScoreWinner(
  score: string
): 'player1' | 'player2' | null {
  const sets = score.split(' ');
  let player1Sets = 0;
  let player2Sets = 0;

  for (const set of sets) {
    const match = set.match(/^(\d+)-(\d+)/);
    if (match) {
      const p1 = parseInt(match[1] ?? '0', 10);
      const p2 = parseInt(match[2] ?? '0', 10);
      if (p1 > p2) player1Sets++;
      else if (p2 > p1) player2Sets++;
    }
  }

  if (player1Sets >= 2) return 'player1';
  if (player2Sets >= 2) return 'player2';
  return null;
}

/**
 * Formate un numéro de téléphone français
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  if (cleaned.length === 11 && cleaned.startsWith('33')) {
    return '+33 ' + cleaned.slice(2).replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}

/**
 * Génère une couleur de fond basée sur une chaîne (pour les avatars)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

/**
 * Pluralise un mot français (basique)
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count <= 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural || singular + 's'}`;
}
