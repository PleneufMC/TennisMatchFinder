/**
 * Version de l'application TennisMatchFinder
 * 
 * Semantic Versioning : MAJOR.MINOR.PATCH-PRERELEASE
 * - MAJOR : Changements incompatibles
 * - MINOR : Nouvelles fonctionnalités rétrocompatibles
 * - PATCH : Corrections de bugs rétrocompatibles
 * - PRERELEASE : alpha, beta, rc (release candidate)
 */

export const APP_VERSION = '0.9.0-beta';

export const VERSION_INFO = {
  version: APP_VERSION,
  name: 'Pionniers',
  releaseDate: '2026-01-13',
  description: 'Version beta pour les premiers utilisateurs',
};

/**
 * Retourne la version formatée pour l'affichage
 */
export function getVersionDisplay(): string {
  return `v${APP_VERSION}`;
}

/**
 * Retourne la version courte (sans prerelease)
 */
export function getVersionShort(): string {
  return APP_VERSION.split('-')[0] || APP_VERSION;
}
