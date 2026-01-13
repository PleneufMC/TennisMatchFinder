/**
 * Configuration des administrateurs de la plateforme
 * 
 * Super Admins : Ont accès à toutes les fonctionnalités d'administration,
 * peuvent gérer tous les clubs et tous les joueurs de la plateforme.
 */

// Liste des emails des super admins (peuvent gérer tous les clubs)
export const SUPER_ADMIN_EMAILS = [
  'music.music@free.fr',
  'pfermanian@gmail.com', // Pierre Fermanian - Admin principal
  // Ajouter d'autres emails si nécessaire
];

/**
 * Vérifie si un email est celui d'un super admin
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Clubs spéciaux de la plateforme
 */
export const SPECIAL_CLUBS = {
  // Club par défaut pour les joueurs sans affiliation
  OPEN_CLUB_SLUG: 'open-club',
} as const;
