/**
 * Rendu Markdown sécurisé pour les contenus utilisateur (forum, etc.).
 *
 * Pourquoi Markdown et pas HTML brut :
 *  - sécurité : on contrôle entièrement le HTML produit, puis on le sanitise ;
 *  - simplicité pour les membres : **gras**, listes, titres, liens… intuitifs ;
 *  - rétro-compatibilité : un texte simple (sans markdown) reste lisible tel quel.
 *
 * Pipeline : texte (markdown) -> marked -> HTML -> DOMPurify (sanitisation stricte).
 * On autorise une liste blanche de balises/attributs. Aucun script, aucun style
 * inline, aucun handler d'événement ne peut passer.
 */
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

// Balises autorisées dans le rendu final (whitelist volontairement restreinte).
const ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'del', 's', 'u',
  'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'blockquote',
  'code', 'pre',
  'a',
  'span',
];

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];

// Configuration marked : pas de HTML brut inline, conversion des retours à la ligne.
marked.setOptions({
  gfm: true,
  breaks: true, // un simple retour à la ligne = <br>, plus naturel pour un forum
});

// Tous les liens s'ouvrent dans un nouvel onglet de façon sûre (anti-tabnabbing).
// Le hook est enregistré une seule fois au chargement du module.
let hookRegistered = false;
function ensureLinkHook() {
  if (hookRegistered) return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });
  hookRegistered = true;
}

/**
 * Convertit un texte markdown en HTML sûr (string).
 * Renvoie une chaîne vide si l'entrée est vide.
 */
export function renderMarkdown(input: string | null | undefined): string {
  if (!input) return '';

  ensureLinkHook();

  // marked.parse est synchrone tant qu'aucune extension async n'est activée.
  const rawHtml = marked.parse(input, { async: false }) as string;

  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Empêche tout protocole dangereux (javascript:, data:, etc.) sur les liens.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });

  return clean;
}
