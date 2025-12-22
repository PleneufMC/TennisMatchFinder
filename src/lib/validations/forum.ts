import { z } from 'zod';
import type { ForumCategory, ReactionEmoji } from '@/types/forum';

/**
 * Schémas de validation pour le forum
 */

// Catégories valides
export const forumCategories: ForumCategory[] = [
  'général',
  'recherche-partenaire',
  'résultats',
  'équipement',
  'annonces',
];

// Emojis de réaction valides
export const reactionEmojis: ReactionEmoji[] = ['👍', '🎾', '🔥', '😂', '🤔'];

// Création d'un thread
export const createThreadSchema = z.object({
  category: z.enum(['général', 'recherche-partenaire', 'résultats', 'équipement', 'annonces'], {
    errorMap: () => ({ message: 'Catégorie invalide' }),
  }),
  title: z
    .string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .trim(),
  content: z
    .string()
    .min(10, 'Le contenu doit contenir au moins 10 caractères')
    .max(10000, 'Le contenu ne peut pas dépasser 10 000 caractères')
    .trim(),
});

// Mise à jour d'un thread
export const updateThreadSchema = z.object({
  title: z
    .string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .trim()
    .optional(),
  content: z
    .string()
    .min(10, 'Le contenu doit contenir au moins 10 caractères')
    .max(10000, 'Le contenu ne peut pas dépasser 10 000 caractères')
    .trim()
    .optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

// Création d'une réponse
export const createReplySchema = z.object({
  threadId: z.string().uuid('ID de discussion invalide'),
  content: z
    .string()
    .min(1, 'La réponse ne peut pas être vide')
    .max(5000, 'La réponse ne peut pas dépasser 5 000 caractères')
    .trim(),
  parentReplyId: z.string().uuid('ID de réponse parent invalide').optional(),
});

// Mise à jour d'une réponse
export const updateReplySchema = z.object({
  content: z
    .string()
    .min(1, 'La réponse ne peut pas être vide')
    .max(5000, 'La réponse ne peut pas dépasser 5 000 caractères')
    .trim(),
});

// Ajout/suppression de réaction
export const toggleReactionSchema = z.object({
  targetType: z.enum(['thread', 'reply']),
  targetId: z.string().uuid('ID cible invalide'),
  emoji: z.enum(['👍', '🎾', '🔥', '😂', '🤔'], {
    errorMap: () => ({ message: 'Emoji invalide' }),
  }),
});

// Recherche dans le forum
export const searchThreadsSchema = z.object({
  query: z.string().min(2, 'La recherche doit contenir au moins 2 caractères').max(100).optional(),
  category: z
    .enum(['général', 'recherche-partenaire', 'résultats', 'équipement', 'annonces'])
    .optional(),
  authorId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(20),
});

// Types inférés
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type UpdateReplyInput = z.infer<typeof updateReplySchema>;
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
export type SearchThreadsInput = z.infer<typeof searchThreadsSchema>;

/**
 * Détecte et extrait les mentions @pseudo dans le contenu
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s'-]*)/g;
  const matches = content.matchAll(mentionRegex);
  return [...matches].map((match) => match[1]?.trim() ?? '').filter((name) => name.length > 0);
}

/**
 * Sanitize le contenu du forum (basique, le vrai sanitize se fait côté rendu)
 */
export function sanitizeForumContent(content: string): string {
  return content
    .trim()
    // Supprime les caractères de contrôle
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalise les sauts de ligne
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Limite les sauts de ligne consécutifs
    .replace(/\n{4,}/g, '\n\n\n');
}
