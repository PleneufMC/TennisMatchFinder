import type { Tables, Enums } from './database';
import type { Player } from './player';

/**
 * Types étendus pour le forum
 */

// Types de base
export type ForumThread = Tables<'forum_threads'>;
export type ForumReply = Tables<'forum_replies'>;
export type ForumReaction = Tables<'forum_reactions'>;
export type ForumCategory = Enums<'forum_category'>;
export type ReactionEmoji = Enums<'reaction_emoji'>;

// Thread avec auteur
export interface ThreadWithAuthor extends ForumThread {
  author: Pick<Player, 'id' | 'full_name' | 'avatar_url' | 'current_elo'> | null;
  lastReplyByPlayer?: Pick<Player, 'id' | 'full_name' | 'avatar_url'> | null;
}

// Thread complet pour l'affichage détaillé
export interface ThreadDetail extends ThreadWithAuthor {
  replies: ReplyWithAuthor[];
  reactions: ReactionCount[];
  userReactions?: ReactionEmoji[];
}

// Réponse avec auteur
export interface ReplyWithAuthor extends ForumReply {
  author: Pick<Player, 'id' | 'full_name' | 'avatar_url' | 'current_elo'> | null;
  reactions: ReactionCount[];
  userReactions?: ReactionEmoji[];
  childReplies?: ReplyWithAuthor[];
}

// Comptage des réactions
export interface ReactionCount {
  emoji: ReactionEmoji;
  count: number;
}

// Création de thread
export interface CreateThreadInput {
  category: ForumCategory;
  title: string;
  content: string;
}

// Création de réponse
export interface CreateReplyInput {
  threadId: string;
  content: string;
  parentReplyId?: string;
}

// Filtre pour la liste des threads
export interface ThreadFilters {
  category?: ForumCategory;
  search?: string;
  authorId?: string;
  isPinned?: boolean;
}

// Pagination
export interface ThreadListResult {
  threads: ThreadWithAuthor[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

// Catégories avec métadonnées
export interface CategoryInfo {
  value: ForumCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const FORUM_CATEGORIES: CategoryInfo[] = [
  {
    value: 'général',
    label: 'Général',
    description: 'Discussions générales sur le tennis',
    icon: '💬',
    color: 'blue',
  },
  {
    value: 'recherche-partenaire',
    label: 'Recherche Partenaire',
    description: 'Trouvez un partenaire de jeu',
    icon: '🎾',
    color: 'green',
  },
  {
    value: 'résultats',
    label: 'Résultats',
    description: 'Annonces de résultats de matchs',
    icon: '🏆',
    color: 'yellow',
  },
  {
    value: 'équipement',
    label: 'Équipement',
    description: 'Discussions sur l\'équipement',
    icon: '🎒',
    color: 'purple',
  },
  {
    value: 'annonces',
    label: 'Annonces',
    description: 'Annonces officielles du club',
    icon: '📢',
    color: 'red',
  },
];

// Emojis de réaction disponibles
export const REACTION_EMOJIS: ReactionEmoji[] = ['👍', '🎾', '🔥', '😂', '🤔'];
