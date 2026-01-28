import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  primaryKey,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccount } from 'next-auth/adapters';

// ============================================
// ENUMS
// ============================================

export const playerLevelEnum = pgEnum('player_level', [
  'débutant',
  'intermédiaire',
  'avancé',
  'expert',
]);

export const gameTypeEnum = pgEnum('game_type', ['simple', 'double']);

export const courtSurfaceEnum = pgEnum('court_surface', [
  'terre battue',
  'dur',
  'gazon',
  'indoor',
]);

export const weekdayEnum = pgEnum('weekday', [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
]);

export const timeSlotEnum = pgEnum('time_slot', [
  'matin',
  'midi',
  'après-midi',
  'soir',
]);

export const forumCategoryEnum = pgEnum('forum_category', [
  'général',
  'recherche-partenaire',
  'résultats',
  'équipement',
  'annonces',
]);

export const proposalStatusEnum = pgEnum('proposal_status', [
  'pending',
  'accepted',
  'declined',
  'expired',
]);

export const eloChangeReasonEnum = pgEnum('elo_change_reason', [
  'match_win',
  'match_loss',
  'inactivity_decay',
  'manual_adjustment',
]);

export const matchFormatEnum = pgEnum('match_format', [
  'one_set',
  'two_sets',
  'two_sets_super_tb',  // 2 sets gagnants + Super TB au 3ème (10 pts)
  'three_sets',
  'super_tiebreak',     // Match en Super TB uniquement (10 pts)
]);

export const joinRequestStatusEnum = pgEnum('join_request_status', [
  'pending',
  'approved',
  'rejected',
]);

export const clubCreationStatusEnum = pgEnum('club_creation_status', [
  'pending',
  'approved',
  'rejected',
]);

// Stripe subscription tiers
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'premium',
  'pro',
]);

// Stripe subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'paused',
  'trialing',
  'unpaid',
]);

// Type exports for subscription
export type SubscriptionTier = 'free' | 'premium' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';

// ============================================
// NEXT-AUTH TABLES
// ============================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ============================================
// PASSKEYS / WEBAUTHN
// ============================================

export const passkeys = pgTable('passkeys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // WebAuthn credential ID (base64url encoded)
  credentialId: text('credential_id').notNull().unique(),
  // WebAuthn credential public key (base64url encoded)
  credentialPublicKey: text('credential_public_key').notNull(),
  // Sign count for replay attack prevention
  counter: integer('counter').notNull().default(0),
  // Credential device type: 'singleDevice' | 'multiDevice'
  credentialDeviceType: varchar('credential_device_type', { length: 32 }).notNull(),
  // Whether the credential is backed up (iCloud Keychain, Google Password Manager, etc.)
  credentialBackedUp: boolean('credential_backed_up').notNull().default(false),
  // Transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid']
  transports: jsonb('transports').$type<string[]>(),
  // Human-readable name for the passkey (e.g., "iPhone de Pierre")
  name: varchar('name', { length: 100 }),
  // Last used timestamp
  lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('passkeys_user_id_idx').on(table.userId),
  credentialIdIdx: index('passkeys_credential_id_idx').on(table.credentialId),
}));

// Challenge storage for WebAuthn (temporary, expires quickly)
export const webauthnChallenges = pgTable('webauthn_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  challenge: text('challenge').notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'registration' | 'authentication'
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  challengeIdx: index('webauthn_challenges_challenge_idx').on(table.challenge),
  expiresAtIdx: index('webauthn_challenges_expires_at_idx').on(table.expiresAt),
}));

// ============================================
// APPLICATION TABLES
// ============================================

// Clubs
export const clubs = pgTable('clubs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  settings: jsonb('settings').default({}).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  websiteUrl: text('website_url'),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Players (extends users with tennis-specific data)
export const players = pgTable(
  'players',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    clubId: uuid('club_id')
      .references(() => clubs.id, { onDelete: 'set null' }), // Nullable - joueur non affilié
    city: varchar('city', { length: 100 }), // Ville du joueur (pour non affiliés)
    latitude: numeric('latitude', { precision: 10, scale: 8 }), // Coordonnées GPS
    longitude: numeric('longitude', { precision: 11, scale: 8 }), // Coordonnées GPS
    fullName: varchar('full_name', { length: 100 }).notNull(),
    avatarUrl: text('avatar_url'),
    phone: varchar('phone', { length: 20 }),
    bio: text('bio'),
    currentElo: integer('current_elo').default(1200).notNull(),
    bestElo: integer('best_elo').default(1200).notNull(),
    lowestElo: integer('lowest_elo').default(1200).notNull(),
    selfAssessedLevel: playerLevelEnum('self_assessed_level').default('intermédiaire').notNull(),
    availability: jsonb('availability').default({ days: [], timeSlots: [] }).notNull(),
    preferences: jsonb('preferences').default({ gameTypes: ['simple'], surfaces: [] }).notNull(),
    matchesPlayed: integer('matches_played').default(0).notNull(),
    wins: integer('wins').default(0).notNull(),
    losses: integer('losses').default(0).notNull(),
    winStreak: integer('win_streak').default(0).notNull(),
    bestWinStreak: integer('best_win_streak').default(0).notNull(),
    uniqueOpponents: integer('unique_opponents').default(0).notNull(),
    // Réputation (système d'évaluation post-match)
    reputationAvg: numeric('reputation_avg', { precision: 2, scale: 1 }), // Moyenne générale (null = pas encore évalué)
    reputationPunctuality: numeric('reputation_punctuality', { precision: 2, scale: 1 }), // Moyenne ponctualité
    reputationFairPlay: numeric('reputation_fair_play', { precision: 2, scale: 1 }), // Moyenne fair-play
    reputationFriendliness: numeric('reputation_friendliness', { precision: 2, scale: 1 }), // Moyenne convivialité
    reputationCount: integer('reputation_count').default(0).notNull(), // Nombre d'évaluations reçues
    isAdmin: boolean('is_admin').default(false).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
    // WhatsApp notifications
    whatsappNumber: varchar('whatsapp_number', { length: 20 }), // Format international: +33612345678
    whatsappOptIn: boolean('whatsapp_opt_in').default(false).notNull(), // Consentement explicite
    whatsappVerified: boolean('whatsapp_verified').default(false).notNull(), // Numéro vérifié
    // Weekly challenge streak
    currentStreak: integer('current_streak').default(0).notNull(), // Semaines consécutives validées
    bestStreak: integer('best_streak').default(0).notNull(), // Meilleur streak historique
    lastStreakUpdate: timestamp('last_streak_update', { mode: 'date' }), // Dernière mise à jour du streak
    lastActiveAt: timestamp('last_active_at', { mode: 'date' }).defaultNow().notNull(),
    lastMatchAt: timestamp('last_match_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('players_club_id_idx').on(table.clubId),
    currentEloIdx: index('players_current_elo_idx').on(table.currentElo),
  })
);

// Matches
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    player1Id: uuid('player1_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    player2Id: uuid('player2_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    winnerId: uuid('winner_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    score: varchar('score', { length: 50 }).notNull(),
    matchFormat: matchFormatEnum('match_format').default('two_sets').notNull(),
    gameType: gameTypeEnum('game_type').default('simple').notNull(),
    surface: courtSurfaceEnum('surface'),
    location: varchar('location', { length: 100 }),
    player1EloBefore: integer('player1_elo_before').notNull(),
    player2EloBefore: integer('player2_elo_before').notNull(),
    player1EloAfter: integer('player1_elo_after').notNull(),
    player2EloAfter: integer('player2_elo_after').notNull(),
    modifiersApplied: jsonb('modifiers_applied').default({}).notNull(),
    playedAt: timestamp('played_at', { mode: 'date' }).notNull(),
    reportedBy: uuid('reported_by').references(() => players.id),
    validated: boolean('validated').default(false).notNull(),
    validatedBy: uuid('validated_by').references(() => players.id),
    validatedAt: timestamp('validated_at', { mode: 'date' }),
    // Auto-validation system
    autoValidated: boolean('auto_validated').default(false).notNull(),
    autoValidateAt: timestamp('auto_validate_at', { mode: 'date' }), // Quand auto-valider
    reminderSentAt: timestamp('reminder_sent_at', { mode: 'date' }), // Rappel envoyé
    // Contestation system
    contested: boolean('contested').default(false).notNull(),
    contestedBy: uuid('contested_by').references(() => players.id),
    contestedAt: timestamp('contested_at', { mode: 'date' }),
    contestReason: text('contest_reason'),
    contestResolvedAt: timestamp('contest_resolved_at', { mode: 'date' }),
    contestResolution: varchar('contest_resolution', { length: 50 }), // 'upheld' | 'rejected' | 'modified'
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('matches_club_id_idx').on(table.clubId),
    player1IdIdx: index('matches_player1_id_idx').on(table.player1Id),
    player2IdIdx: index('matches_player2_id_idx').on(table.player2Id),
    playedAtIdx: index('matches_played_at_idx').on(table.playedAt),
    autoValidateAtIdx: index('matches_auto_validate_at_idx').on(table.autoValidateAt),
  })
);

// ELO History
export const eloHistory = pgTable(
  'elo_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    matchId: uuid('match_id').references(() => matches.id, { onDelete: 'set null' }),
    elo: integer('elo').notNull(),
    delta: integer('delta').notNull(),
    reason: eloChangeReasonEnum('reason').notNull(),
    // Breakdown ELO (nouveau système coefficients)
    formatCoefficient: numeric('format_coefficient', { precision: 3, scale: 2 }),
    marginModifier: numeric('margin_modifier', { precision: 3, scale: 2 }),
    metadata: jsonb('metadata').default({}).notNull(),
    recordedAt: timestamp('recorded_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    playerIdIdx: index('elo_history_player_id_idx').on(table.playerId),
    recordedAtIdx: index('elo_history_recorded_at_idx').on(table.recordedAt),
  })
);

// Match Proposals
export const matchProposals = pgTable(
  'match_proposals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    fromPlayerId: uuid('from_player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    toPlayerId: uuid('to_player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    proposedDate: timestamp('proposed_date', { mode: 'date' }),
    proposedTime: varchar('proposed_time', { length: 10 }),
    message: text('message'),
    status: proposalStatusEnum('status').default('pending').notNull(),
    respondedAt: timestamp('responded_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    fromPlayerIdIdx: index('match_proposals_from_player_id_idx').on(table.fromPlayerId),
    toPlayerIdIdx: index('match_proposals_to_player_id_idx').on(table.toPlayerId),
    statusIdx: index('match_proposals_status_idx').on(table.status),
  })
);

// Forum Threads
export const forumThreads = pgTable(
  'forum_threads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => players.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    category: forumCategoryEnum('category').default('général').notNull(),
    isPinned: boolean('is_pinned').default(false).notNull(),
    isLocked: boolean('is_locked').default(false).notNull(),
    isBot: boolean('is_bot').default(false).notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    replyCount: integer('reply_count').default(0).notNull(),
    lastReplyAt: timestamp('last_reply_at', { mode: 'date' }),
    lastReplyBy: uuid('last_reply_by').references(() => players.id),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('forum_threads_club_id_idx').on(table.clubId),
    categoryIdx: index('forum_threads_category_idx').on(table.category),
    createdAtIdx: index('forum_threads_created_at_idx').on(table.createdAt),
  })
);

// Forum Replies
export const forumReplies = pgTable(
  'forum_replies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => forumThreads.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => players.id, { onDelete: 'set null' }),
    parentReplyId: uuid('parent_reply_id'),
    content: text('content').notNull(),
    isBot: boolean('is_bot').default(false).notNull(),
    isSolution: boolean('is_solution').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    threadIdIdx: index('forum_replies_thread_id_idx').on(table.threadId),
  })
);

// Forum Reactions
export const forumReactions = pgTable(
  'forum_reactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    targetType: varchar('target_type', { length: 10 }).notNull(), // 'thread' | 'reply'
    targetId: uuid('target_id').notNull(),
    emoji: varchar('emoji', { length: 10 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userTargetIdx: index('forum_reactions_user_target_idx').on(
      table.userId,
      table.targetType,
      table.targetId
    ),
  })
);

// ============================================
// BADGES SYSTEM (Trophy Case 2.0)
// ============================================

export const badgeTierEnum = pgEnum('badge_tier', [
  'common',
  'rare', 
  'epic',
  'legendary',
]);

export const badgeCategoryEnum = pgEnum('badge_category', [
  'milestone',    // Jalons de progression
  'achievement',  // Exploits sportifs
  'social',       // Engagement communautaire
  'special',      // Événements spéciaux
]);

// Badges Master Table (définition des badges disponibles)
export const badges = pgTable(
  'badges',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // ex: 'first-rally', 'century'
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description').notNull(),
    criteria: text('criteria').notNull(), // Description humaine: "Gagnez votre premier match"
    category: badgeCategoryEnum('category').notNull(),
    tier: badgeTierEnum('tier').default('common').notNull(),
    icon: varchar('icon', { length: 50 }).notNull(), // Nom icône Lucide ou custom
    iconColor: varchar('icon_color', { length: 20 }), // Couleur hex optionnelle
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isDynamic: boolean('is_dynamic').default(false).notNull(), // true = peut être retiré (ex: King of Club)
    // Métadonnées pour badges progressifs
    maxProgress: integer('max_progress'), // ex: 100 pour Century
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('badges_category_idx').on(table.category),
    tierIdx: index('badges_tier_idx').on(table.tier),
  })
);

// Player Badges (badges débloqués par joueur)
export const playerBadges = pgTable(
  'player_badges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    badgeId: varchar('badge_id', { length: 50 })
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    // Tracking
    progress: integer('progress').default(0).notNull(), // Progression actuelle (ex: 45/100 matchs)
    seen: boolean('seen').default(false).notNull(), // true = célébration déjà affichée
    // Timestamps
    earnedAt: timestamp('earned_at', { mode: 'date' }).defaultNow().notNull(),
    seenAt: timestamp('seen_at', { mode: 'date' }), // Quand l'utilisateur a vu la célébration
  },
  (table) => ({
    playerIdIdx: index('player_badges_player_id_idx').on(table.playerId),
    badgeIdIdx: index('player_badges_badge_id_idx').on(table.badgeId),
    uniqueBadge: index('player_badges_unique_idx').on(table.playerId, table.badgeId),
  })
);

// Notifications
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    link: text('link'),
    data: jsonb('data').default({}).notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  })
);

// ============================================
// PUSH SUBSCRIPTIONS (Web Push Notifications)
// ============================================

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(), // Public key for encryption
    auth: text('auth').notNull(), // Auth secret
    userAgent: text('user_agent'), // Browser/device info
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
  },
  (table) => ({
    userIdIdx: index('push_subscriptions_user_id_idx').on(table.userId),
    endpointIdx: index('push_subscriptions_endpoint_idx').on(table.endpoint),
  })
);

// ============================================
// CLUB JOIN REQUESTS (Demandes d'adhésion)
// ============================================

export const clubJoinRequests = pgTable(
  'club_join_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    message: text('message'), // Message de présentation du joueur
    selfAssessedLevel: playerLevelEnum('self_assessed_level').default('intermédiaire').notNull(),
    status: joinRequestStatusEnum('status').default('pending').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => players.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('club_join_requests_club_id_idx').on(table.clubId),
    userIdIdx: index('club_join_requests_user_id_idx').on(table.userId),
    statusIdx: index('club_join_requests_status_idx').on(table.status),
  })
);

// ============================================
// CLUB CREATION REQUESTS (Demandes de création de club)
// ============================================

export const clubCreationRequests = pgTable(
  'club_creation_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Infos du demandeur
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    requesterName: varchar('requester_name', { length: 100 }).notNull(),
    requesterEmail: varchar('requester_email', { length: 255 }).notNull(),
    requesterPhone: varchar('requester_phone', { length: 20 }),
    // Infos du club demandé
    clubName: varchar('club_name', { length: 100 }).notNull(),
    clubSlug: varchar('club_slug', { length: 50 }).notNull(),
    clubDescription: text('club_description'),
    clubAddress: text('club_address'),
    clubWebsite: text('club_website'),
    estimatedMembers: integer('estimated_members'), // Nombre estimé de membres
    // Validation
    approvalToken: varchar('approval_token', { length: 64 }).notNull().unique(),
    status: clubCreationStatusEnum('status').default('pending').notNull(),
    reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
    rejectionReason: text('rejection_reason'),
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(), // Token expire après X jours
  },
  (table) => ({
    userIdIdx: index('club_creation_requests_user_id_idx').on(table.userId),
    statusIdx: index('club_creation_requests_status_idx').on(table.status),
    tokenIdx: index('club_creation_requests_token_idx').on(table.approvalToken),
  })
);

// ============================================
// CHAT TABLES
// ============================================

// Chat Rooms (conversations)
export const chatRooms = pgTable(
  'chat_rooms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }),
    description: text('description'), // Description du salon
    icon: varchar('icon', { length: 50 }), // Emoji ou nom d'icône pour le salon
    isDirect: boolean('is_direct').default(false).notNull(), // true = conversation privée
    isGroup: boolean('is_group').default(false).notNull(),   // true = conversation de groupe
    isSection: boolean('is_section').default(false).notNull(), // true = salon de section du club (visible par tous les membres)
    sectionOrder: integer('section_order').default(0).notNull(), // Ordre d'affichage des sections
    createdBy: uuid('created_by').references(() => players.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('chat_rooms_club_id_idx').on(table.clubId),
    sectionIdx: index('chat_rooms_section_idx').on(table.clubId, table.isSection),
  })
);

// Chat Room Members (participants)
export const chatRoomMembers = pgTable(
  'chat_room_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    isAdmin: boolean('is_admin').default(false).notNull(),
    lastReadAt: timestamp('last_read_at', { mode: 'date' }),
    joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    roomIdIdx: index('chat_room_members_room_id_idx').on(table.roomId),
    playerIdIdx: index('chat_room_members_player_id_idx').on(table.playerId),
    uniqueMember: index('chat_room_members_unique_idx').on(table.roomId, table.playerId),
  })
);

// Chat Messages
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').references(() => players.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    messageType: varchar('message_type', { length: 20 }).default('text').notNull(), // 'text', 'image', 'system'
    metadata: jsonb('metadata').default({}).notNull(),
    isEdited: boolean('is_edited').default(false).notNull(),
    editedAt: timestamp('edited_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    roomIdIdx: index('chat_messages_room_id_idx').on(table.roomId),
    senderIdIdx: index('chat_messages_sender_id_idx').on(table.senderId),
    createdAtIdx: index('chat_messages_created_at_idx').on(table.createdAt),
  })
);

// ============================================
// SUBSCRIPTION & STRIPE TABLES
// ============================================

// Subscriptions
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    stripePriceId: varchar('stripe_price_id', { length: 255 }),
    tier: subscriptionTierEnum('tier').default('free').notNull(),
    status: subscriptionStatusEnum('status').default('active').notNull(),
    currentPeriodStart: timestamp('current_period_start', { mode: 'date' }),
    currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    canceledAt: timestamp('canceled_at', { mode: 'date' }),
    trialStart: timestamp('trial_start', { mode: 'date' }),
    trialEnd: timestamp('trial_end', { mode: 'date' }),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
    stripeCustomerIdIdx: index('subscriptions_stripe_customer_id_idx').on(table.stripeCustomerId),
    stripeSubscriptionIdIdx: index('subscriptions_stripe_subscription_id_idx').on(table.stripeSubscriptionId),
    statusIdx: index('subscriptions_status_idx').on(table.status),
  })
);

// Payment History
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }),
    amount: integer('amount').notNull(), // in cents
    currency: varchar('currency', { length: 3 }).default('eur').notNull(),
    status: varchar('status', { length: 50 }).notNull(), // 'succeeded', 'pending', 'failed'
    description: text('description'),
    metadata: jsonb('metadata').default({}).notNull(),
    paidAt: timestamp('paid_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('payments_user_id_idx').on(table.userId),
    stripePaymentIntentIdIdx: index('payments_stripe_payment_intent_id_idx').on(table.stripePaymentIntentId),
    statusIdx: index('payments_status_idx').on(table.status),
  })
);

// ============================================
// MATCH NOW (Disponibilité instantanée)
// ============================================

export const matchNowAvailability = pgTable(
  'match_now_availability',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    clubId: uuid('club_id')
      .references(() => clubs.id, { onDelete: 'cascade' }), // Nullable pour mode proximité
    availableUntil: timestamp('available_until', { mode: 'date' }).notNull(),
    message: varchar('message', { length: 200 }), // "Dispo courts 5-7, niveau intermédiaire+"
    gameTypes: jsonb('game_types').default(['simple']).notNull(), // ['simple', 'double']
    eloMin: integer('elo_min'), // Filtre optionnel ELO minimum
    eloMax: integer('elo_max'), // Filtre optionnel ELO maximum
    searchMode: varchar('search_mode', { length: 20 }).default('club').notNull(), // 'club' ou 'proximity'
    radiusKm: integer('radius_km'), // Rayon de recherche en km (mode proximity)
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    playerIdIdx: index('match_now_player_id_idx').on(table.playerId),
    clubIdIdx: index('match_now_club_id_idx').on(table.clubId),
    activeUntilIdx: index('match_now_active_until_idx').on(table.isActive, table.availableUntil),
  })
);

// Match Now Responses (réponses aux disponibilités)
export const matchNowResponses = pgTable(
  'match_now_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    availabilityId: uuid('availability_id')
      .notNull()
      .references(() => matchNowAvailability.id, { onDelete: 'cascade' }),
    responderId: uuid('responder_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    message: varchar('message', { length: 200 }),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'accepted', 'declined'
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    availabilityIdIdx: index('match_now_responses_availability_id_idx').on(table.availabilityId),
    responderIdIdx: index('match_now_responses_responder_id_idx').on(table.responderId),
  })
);

// ============================================
// MATCH RATINGS (Évaluations post-match)
// ============================================

// Table des évaluations après un match
export const matchRatings = pgTable(
  'match_ratings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    raterId: uuid('rater_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    ratedPlayerId: uuid('rated_player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    // Critères d'évaluation (1-5 étoiles)
    punctuality: integer('punctuality').notNull(), // Ponctualité
    fairPlay: integer('fair_play').notNull(),      // Fair-play
    friendliness: integer('friendliness').notNull(), // Convivialité
    // Commentaire optionnel (privé, pour les admins)
    comment: text('comment'),
    // Moyenne calculée
    averageRating: numeric('average_rating', { precision: 2, scale: 1 }).notNull(),
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    matchIdIdx: index('match_ratings_match_id_idx').on(table.matchId),
    raterIdIdx: index('match_ratings_rater_id_idx').on(table.raterId),
    ratedPlayerIdIdx: index('match_ratings_rated_player_id_idx').on(table.ratedPlayerId),
    // Un joueur ne peut évaluer qu'une fois par match
    uniqueRating: index('match_ratings_unique_idx').on(table.matchId, table.raterId),
  })
);

// ============================================
// BOX LEAGUES (Compétitions mensuelles)
// ============================================

export const boxLeagueStatusEnum = pgEnum('box_league_status', [
  'draft',        // En préparation
  'registration', // Inscriptions ouvertes
  'active',       // En cours
  'completed',    // Terminée
  'cancelled',    // Annulée
]);

// Box League (compétition mensuelle)
export const boxLeagues = pgTable(
  'box_leagues',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    // Période
    startDate: timestamp('start_date', { mode: 'date' }).notNull(),
    endDate: timestamp('end_date', { mode: 'date' }).notNull(),
    registrationDeadline: timestamp('registration_deadline', { mode: 'date' }).notNull(),
    // Configuration
    minPlayers: integer('min_players').default(4).notNull(),
    maxPlayers: integer('max_players').default(6).notNull(),
    eloRangeMin: integer('elo_range_min'), // ELO minimum pour cette division
    eloRangeMax: integer('elo_range_max'), // ELO maximum pour cette division
    division: integer('division').default(1).notNull(), // 1 = Division 1 (top), 2, 3...
    matchesPerPlayer: integer('matches_per_player').default(5).notNull(), // Matchs requis
    // Points système
    pointsWin: integer('points_win').default(3).notNull(),
    pointsDraw: integer('points_draw').default(1).notNull(),
    pointsLoss: integer('points_loss').default(0).notNull(),
    pointsForfeit: integer('points_forfeit').default(-1).notNull(),
    // Promotion/Relégation
    promotionSpots: integer('promotion_spots').default(1).notNull(), // Nombre de promus
    relegationSpots: integer('relegation_spots').default(1).notNull(), // Nombre de relégués
    // Poules/Groupes
    poolCount: integer('pool_count').default(1).notNull(), // Nombre de poules (1 = pas de poules)
    playersPerPool: integer('players_per_pool').default(6).notNull(), // Joueurs par poule
    poolsDrawn: boolean('pools_drawn').default(false).notNull(), // Tirage effectué ?
    // Status
    status: boxLeagueStatusEnum('status').default('draft').notNull(),
    // Metadata
    createdBy: uuid('created_by').references(() => players.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('box_leagues_club_id_idx').on(table.clubId),
    statusIdx: index('box_leagues_status_idx').on(table.status),
    datesIdx: index('box_leagues_dates_idx').on(table.startDate, table.endDate),
  })
);

// Participants à une Box League
export const boxLeagueParticipants = pgTable(
  'box_league_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    leagueId: uuid('league_id')
      .notNull()
      .references(() => boxLeagues.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    // Stats dans cette league
    eloAtStart: integer('elo_at_start').notNull(), // ELO au moment de l'inscription
    matchesPlayed: integer('matches_played').default(0).notNull(),
    matchesWon: integer('matches_won').default(0).notNull(),
    matchesLost: integer('matches_lost').default(0).notNull(),
    matchesDrawn: integer('matches_drawn').default(0).notNull(),
    points: integer('points').default(0).notNull(),
    setsWon: integer('sets_won').default(0).notNull(),
    setsLost: integer('sets_lost').default(0).notNull(),
    gamesWon: integer('games_won').default(0).notNull(),
    gamesLost: integer('games_lost').default(0).notNull(),
    // Classement final
    finalRank: integer('final_rank'),
    isPromoted: boolean('is_promoted').default(false).notNull(),
    isRelegated: boolean('is_relegated').default(false).notNull(),
    // Poule assignée
    poolNumber: integer('pool_number'), // null = pas encore assigné, 1 = Poule A, 2 = Poule B, etc.
    // Status
    isActive: boolean('is_active').default(true).notNull(), // false si retiré
    withdrawReason: text('withdraw_reason'),
    // Timestamps
    registeredAt: timestamp('registered_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    leagueIdIdx: index('box_league_participants_league_id_idx').on(table.leagueId),
    playerIdIdx: index('box_league_participants_player_id_idx').on(table.playerId),
    pointsIdx: index('box_league_participants_points_idx').on(table.points),
    uniqueParticipant: index('box_league_participants_unique_idx').on(table.leagueId, table.playerId),
  })
);

// Matchs d'une Box League
export const boxLeagueMatches = pgTable(
  'box_league_matches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    leagueId: uuid('league_id')
      .notNull()
      .references(() => boxLeagues.id, { onDelete: 'cascade' }),
    player1Id: uuid('player1_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    player2Id: uuid('player2_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    // Résultat
    winnerId: uuid('winner_id').references(() => players.id, { onDelete: 'set null' }),
    score: varchar('score', { length: 50 }), // Ex: "6-4 6-3"
    player1Sets: integer('player1_sets'),
    player2Sets: integer('player2_sets'),
    player1Games: integer('player1_games'),
    player2Games: integer('player2_games'),
    // Status
    status: varchar('status', { length: 20 }).default('scheduled').notNull(), // 'scheduled', 'completed', 'forfeit', 'cancelled'
    forfeitBy: uuid('forfeit_by').references(() => players.id, { onDelete: 'set null' }),
    // Lien avec le match principal (pour intégration ELO)
    mainMatchId: uuid('main_match_id').references(() => matches.id, { onDelete: 'set null' }),
    // Dates
    scheduledDate: timestamp('scheduled_date', { mode: 'date' }),
    playedAt: timestamp('played_at', { mode: 'date' }),
    deadline: timestamp('deadline', { mode: 'date' }), // Date limite pour jouer
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    leagueIdIdx: index('box_league_matches_league_id_idx').on(table.leagueId),
    player1IdIdx: index('box_league_matches_player1_id_idx').on(table.player1Id),
    player2IdIdx: index('box_league_matches_player2_id_idx').on(table.player2Id),
    statusIdx: index('box_league_matches_status_idx').on(table.status),
  })
);

// ============================================
// TOURNAMENTS (Tournois à élimination directe)
// ============================================

export const tournamentStatusEnum = pgEnum('tournament_status', [
  'draft',        // En préparation
  'registration', // Inscriptions ouvertes
  'seeding',      // Tirage au sort / Seeding
  'active',       // En cours
  'completed',    // Terminé
  'cancelled',    // Annulé
]);

export const tournamentFormatEnum = pgEnum('tournament_format', [
  'single_elimination',  // Élimination directe simple
  'double_elimination',  // Élimination directe avec repêchage
  'consolation',         // Avec tableau de consolation
]);

// Tournoi
export const tournaments = pgTable(
  'tournaments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    // Format
    format: tournamentFormatEnum('format').default('single_elimination').notNull(),
    maxParticipants: integer('max_participants').default(16).notNull(), // 4, 8, 16, 32, 64
    minParticipants: integer('min_participants').default(4).notNull(),
    // Critères
    eloRangeMin: integer('elo_range_min'),
    eloRangeMax: integer('elo_range_max'),
    seedingMethod: varchar('seeding_method', { length: 20 }).default('elo').notNull(), // 'elo', 'random'
    // Dates
    registrationStart: timestamp('registration_start', { mode: 'date' }).notNull(),
    registrationEnd: timestamp('registration_end', { mode: 'date' }).notNull(),
    startDate: timestamp('start_date', { mode: 'date' }).notNull(),
    endDate: timestamp('end_date', { mode: 'date' }),
    // Règles
    setsToWin: integer('sets_to_win').default(2).notNull(), // Best of 3 = 2, Best of 5 = 3
    finalSetsToWin: integer('final_sets_to_win').default(2).notNull(), // Pour la finale
    thirdPlaceMatch: boolean('third_place_match').default(false).notNull(), // Petite finale
    // Paiement
    entryFee: integer('entry_fee').default(0).notNull(), // Frais d'inscription en centimes (0 = gratuit)
    currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
    stripeProductId: varchar('stripe_product_id', { length: 255 }),
    stripePriceId: varchar('stripe_price_id', { length: 255 }),
    // Status
    status: tournamentStatusEnum('status').default('draft').notNull(),
    currentRound: integer('current_round').default(0).notNull(),
    totalRounds: integer('total_rounds'), // Calculé lors du seeding
    // Vainqueur
    winnerId: uuid('winner_id').references(() => players.id, { onDelete: 'set null' }),
    runnerUpId: uuid('runner_up_id').references(() => players.id, { onDelete: 'set null' }),
    thirdPlaceId: uuid('third_place_id').references(() => players.id, { onDelete: 'set null' }),
    // Metadata
    createdBy: uuid('created_by').references(() => players.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('tournaments_club_id_idx').on(table.clubId),
    statusIdx: index('tournaments_status_idx').on(table.status),
    datesIdx: index('tournaments_dates_idx').on(table.startDate),
  })
);

// Participants au tournoi
export const tournamentParticipants = pgTable(
  'tournament_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    // Seeding
    seed: integer('seed'), // Position de tête de série (1 = favori)
    eloAtRegistration: integer('elo_at_registration').notNull(),
    // Résultat final
    finalPosition: integer('final_position'), // 1 = vainqueur, 2 = finaliste, etc.
    eliminatedInRound: integer('eliminated_in_round'),
    // Status
    isActive: boolean('is_active').default(true).notNull(),
    withdrawReason: text('withdraw_reason'),
    // Paiement
    paymentStatus: varchar('payment_status', { length: 20 }).default('pending').notNull(), // 'pending', 'paid', 'refunded', 'free'
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeSessionId: varchar('stripe_session_id', { length: 255 }),
    paidAt: timestamp('paid_at', { mode: 'date' }),
    paidAmount: integer('paid_amount'), // Montant payé en centimes
    // Timestamps
    registeredAt: timestamp('registered_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    tournamentIdIdx: index('tournament_participants_tournament_id_idx').on(table.tournamentId),
    playerIdIdx: index('tournament_participants_player_id_idx').on(table.playerId),
    seedIdx: index('tournament_participants_seed_idx').on(table.seed),
    uniqueParticipant: index('tournament_participants_unique_idx').on(table.tournamentId, table.playerId),
    paymentStatusIdx: index('tournament_participants_payment_status_idx').on(table.paymentStatus),
  })
);

// Matchs du tournoi (bracket)
export const tournamentMatches = pgTable(
  'tournament_matches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    // Position dans le bracket
    round: integer('round').notNull(), // 1 = premier tour, 2 = quarts, etc.
    position: integer('position').notNull(), // Position dans le round (1, 2, 3...)
    bracketType: varchar('bracket_type', { length: 20 }).default('main').notNull(), // 'main', 'consolation', 'losers'
    // Joueurs
    player1Id: uuid('player1_id').references(() => players.id, { onDelete: 'set null' }),
    player2Id: uuid('player2_id').references(() => players.id, { onDelete: 'set null' }),
    player1Seed: integer('player1_seed'),
    player2Seed: integer('player2_seed'),
    // Résultat
    winnerId: uuid('winner_id').references(() => players.id, { onDelete: 'set null' }),
    score: varchar('score', { length: 100 }), // Ex: "6-4 3-6 7-5"
    player1Sets: integer('player1_sets'),
    player2Sets: integer('player2_sets'),
    // Status
    status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'scheduled', 'in_progress', 'completed', 'walkover', 'bye'
    isBye: boolean('is_bye').default(false).notNull(), // Match avec BYE (joueur qualifié automatiquement)
    // Lien vers match suivant
    nextMatchId: uuid('next_match_id'), // Match suivant pour le vainqueur
    // Lien avec le match principal (pour intégration ELO)
    mainMatchId: uuid('main_match_id').references(() => matches.id, { onDelete: 'set null' }),
    // Dates
    scheduledDate: timestamp('scheduled_date', { mode: 'date' }),
    playedAt: timestamp('played_at', { mode: 'date' }),
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    tournamentIdIdx: index('tournament_matches_tournament_id_idx').on(table.tournamentId),
    roundIdx: index('tournament_matches_round_idx').on(table.round),
    statusIdx: index('tournament_matches_status_idx').on(table.status),
    bracketIdx: index('tournament_matches_bracket_idx').on(table.tournamentId, table.bracketType, table.round),
  })
);

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  player: one(players, {
    fields: [users.id],
    references: [players.id],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  subscriptions: many(subscriptions),
  payments: many(payments),
  passkeys: many(passkeys),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, {
    fields: [passkeys.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  players: many(players),
  matches: many(matches),
  forumThreads: many(forumThreads),
  matchProposals: many(matchProposals),
  chatRooms: many(chatRooms),
  joinRequests: many(clubJoinRequests),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  user: one(users, {
    fields: [players.id],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
  matchesAsPlayer1: many(matches, { relationName: 'player1' }),
  matchesAsPlayer2: many(matches, { relationName: 'player2' }),
  eloHistory: many(eloHistory),
  sentProposals: many(matchProposals, { relationName: 'fromPlayer' }),
  receivedProposals: many(matchProposals, { relationName: 'toPlayer' }),
  forumThreads: many(forumThreads),
  forumReplies: many(forumReplies),
  badges: many(playerBadges),
  notifications: many(notifications),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  club: one(clubs, {
    fields: [matches.clubId],
    references: [clubs.id],
  }),
  player1: one(players, {
    fields: [matches.player1Id],
    references: [players.id],
    relationName: 'player1',
  }),
  player2: one(players, {
    fields: [matches.player2Id],
    references: [players.id],
    relationName: 'player2',
  }),
  winner: one(players, {
    fields: [matches.winnerId],
    references: [players.id],
  }),
}));

export const eloHistoryRelations = relations(eloHistory, ({ one }) => ({
  player: one(players, {
    fields: [eloHistory.playerId],
    references: [players.id],
  }),
  match: one(matches, {
    fields: [eloHistory.matchId],
    references: [matches.id],
  }),
}));

export const matchProposalsRelations = relations(matchProposals, ({ one }) => ({
  club: one(clubs, {
    fields: [matchProposals.clubId],
    references: [clubs.id],
  }),
  fromPlayer: one(players, {
    fields: [matchProposals.fromPlayerId],
    references: [players.id],
    relationName: 'fromPlayer',
  }),
  toPlayer: one(players, {
    fields: [matchProposals.toPlayerId],
    references: [players.id],
    relationName: 'toPlayer',
  }),
}));

export const forumThreadsRelations = relations(forumThreads, ({ one, many }) => ({
  club: one(clubs, {
    fields: [forumThreads.clubId],
    references: [clubs.id],
  }),
  author: one(players, {
    fields: [forumThreads.authorId],
    references: [players.id],
  }),
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  thread: one(forumThreads, {
    fields: [forumReplies.threadId],
    references: [forumThreads.id],
  }),
  author: one(players, {
    fields: [forumReplies.authorId],
    references: [players.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  club: one(clubs, {
    fields: [chatRooms.clubId],
    references: [clubs.id],
  }),
  creator: one(players, {
    fields: [chatRooms.createdBy],
    references: [players.id],
  }),
  members: many(chatRoomMembers),
  messages: many(chatMessages),
}));

export const chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatRoomMembers.roomId],
    references: [chatRooms.id],
  }),
  player: one(players, {
    fields: [chatRoomMembers.playerId],
    references: [players.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id],
  }),
  sender: one(players, {
    fields: [chatMessages.senderId],
    references: [players.id],
  }),
}));

export const clubJoinRequestsRelations = relations(clubJoinRequests, ({ one }) => ({
  club: one(clubs, {
    fields: [clubJoinRequests.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubJoinRequests.userId],
    references: [users.id],
  }),
  reviewer: one(players, {
    fields: [clubJoinRequests.reviewedBy],
    references: [players.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  playerBadges: many(playerBadges),
}));

export const playerBadgesRelations = relations(playerBadges, ({ one }) => ({
  player: one(players, {
    fields: [playerBadges.playerId],
    references: [players.id],
  }),
  badge: one(badges, {
    fields: [playerBadges.badgeId],
    references: [badges.id],
  }),
}));

export const matchRatingsRelations = relations(matchRatings, ({ one }) => ({
  match: one(matches, {
    fields: [matchRatings.matchId],
    references: [matches.id],
  }),
  rater: one(players, {
    fields: [matchRatings.raterId],
    references: [players.id],
    relationName: 'rater',
  }),
  ratedPlayer: one(players, {
    fields: [matchRatings.ratedPlayerId],
    references: [players.id],
    relationName: 'ratedPlayer',
  }),
}));

// ============================================
// WEEKLY CHALLENGES
// ============================================

export const playerWeeklyActivity = pgTable(
  'player_weekly_activity',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    // Semaine (format ISO: YYYY-WXX, ex: 2026-W05)
    weekYear: integer('week_year').notNull(), // 2026
    weekNumber: integer('week_number').notNull(), // 1-53
    // Activité de la semaine
    matchesPlayed: integer('matches_played').default(0).notNull(),
    proposalsSent: integer('proposals_sent').default(0).notNull(),
    // Validation du challenge
    challengeValidated: boolean('challenge_validated').default(false).notNull(),
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    playerIdIdx: index('player_weekly_activity_player_id_idx').on(table.playerId),
    weekIdx: index('player_weekly_activity_week_idx').on(table.weekYear, table.weekNumber),
    // Contrainte unique: un seul enregistrement par joueur par semaine
    playerWeekUnique: index('player_weekly_activity_player_week_unique').on(table.playerId, table.weekYear, table.weekNumber),
  })
);

export const playerWeeklyActivityRelations = relations(playerWeeklyActivity, ({ one }) => ({
  player: one(players, {
    fields: [playerWeeklyActivity.playerId],
    references: [players.id],
  }),
}));

// ============================================
// DIRECT MESSAGES (1-to-1 Chat)
// ============================================

export const directConversations = pgTable(
  'direct_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Les deux participants (toujours stockés avec participant1Id < participant2Id pour unicité)
    participant1Id: uuid('participant1_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    participant2Id: uuid('participant2_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    // Dernier message pour affichage dans la liste
    lastMessageAt: timestamp('last_message_at', { mode: 'date' }),
    lastMessagePreview: varchar('last_message_preview', { length: 100 }),
    // Compteurs de messages non lus (par participant)
    unreadCount1: integer('unread_count_1').default(0).notNull(), // Non lus pour participant1
    unreadCount2: integer('unread_count_2').default(0).notNull(), // Non lus pour participant2
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    participant1Idx: index('direct_conversations_participant1_idx').on(table.participant1Id),
    participant2Idx: index('direct_conversations_participant2_idx').on(table.participant2Id),
    // Contrainte unique sur la paire de participants
    uniqueParticipants: index('direct_conversations_unique_participants').on(table.participant1Id, table.participant2Id),
    lastMessageAtIdx: index('direct_conversations_last_message_at_idx').on(table.lastMessageAt),
  })
);

export const directMessages = pgTable(
  'direct_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => directConversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    // Statut de lecture
    readAt: timestamp('read_at', { mode: 'date' }),
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index('direct_messages_conversation_id_idx').on(table.conversationId),
    senderIdIdx: index('direct_messages_sender_id_idx').on(table.senderId),
    createdAtIdx: index('direct_messages_created_at_idx').on(table.createdAt),
  })
);

export const directConversationsRelations = relations(directConversations, ({ one, many }) => ({
  participant1: one(players, {
    fields: [directConversations.participant1Id],
    references: [players.id],
    relationName: 'conversationsAsParticipant1',
  }),
  participant2: one(players, {
    fields: [directConversations.participant2Id],
    references: [players.id],
    relationName: 'conversationsAsParticipant2',
  }),
  messages: many(directMessages),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  conversation: one(directConversations, {
    fields: [directMessages.conversationId],
    references: [directConversations.id],
  }),
  sender: one(players, {
    fields: [directMessages.senderId],
    references: [players.id],
  }),
}));

// ============================================
// ACCOUNT DELETION (RGPD)
// ============================================

export const deletionStatusEnum = pgEnum('deletion_status', [
  'pending',    // Demande en attente (délai de grâce 7 jours)
  'confirmed',  // Confirmée, en attente d'exécution
  'cancelled',  // Annulée par l'utilisateur
  'completed',  // Suppression effectuée
]);

export const accountDeletionRequests = pgTable(
  'account_deletion_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Raison optionnelle (feedback)
    reason: text('reason'),
    reasonCategory: varchar('reason_category', { length: 50 }), // 'not_using', 'privacy', 'found_alternative', 'other'
    // Statut de la demande
    status: deletionStatusEnum('status').default('pending').notNull(),
    // Token de confirmation/annulation (envoyé par email)
    confirmationToken: varchar('confirmation_token', { length: 100 }),
    cancellationToken: varchar('cancellation_token', { length: 100 }),
    // Dates importantes
    requestedAt: timestamp('requested_at', { mode: 'date' }).defaultNow().notNull(),
    scheduledDeletionAt: timestamp('scheduled_deletion_at', { mode: 'date' }).notNull(), // requestedAt + 7 jours
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
    cancelledAt: timestamp('cancelled_at', { mode: 'date' }),
    completedAt: timestamp('completed_at', { mode: 'date' }),
    // Métadonnées pour audit
    ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length
    userAgent: text('user_agent'),
    // Données anonymisées conservées (pour statistiques)
    anonymizedData: jsonb('anonymized_data'), // { matchCount, eloAtDeletion, memberSince, ... }
  },
  (table) => ({
    userIdIdx: index('account_deletion_requests_user_id_idx').on(table.userId),
    statusIdx: index('account_deletion_requests_status_idx').on(table.status),
    scheduledIdx: index('account_deletion_requests_scheduled_idx').on(table.scheduledDeletionAt),
  })
);

export const accountDeletionRequestsRelations = relations(accountDeletionRequests, ({ one }) => ({
  user: one(users, {
    fields: [accountDeletionRequests.userId],
    references: [users.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type AccountDeletionRequest = typeof accountDeletionRequests.$inferSelect;
export type NewAccountDeletionRequest = typeof accountDeletionRequests.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Club = typeof clubs.$inferSelect;
export type NewClub = typeof clubs.$inferInsert;

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

export type EloHistory = typeof eloHistory.$inferSelect;
export type NewEloHistory = typeof eloHistory.$inferInsert;

export type MatchProposal = typeof matchProposals.$inferSelect;
export type NewMatchProposal = typeof matchProposals.$inferInsert;

export type ForumThread = typeof forumThreads.$inferSelect;
export type NewForumThread = typeof forumThreads.$inferInsert;

export type ForumReply = typeof forumReplies.$inferSelect;
export type NewForumReply = typeof forumReplies.$inferInsert;

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

export type PlayerBadge = typeof playerBadges.$inferSelect;
export type NewPlayerBadge = typeof playerBadges.$inferInsert;

export type Notification = typeof notifications.$inferSelect;

export type BadgeTier = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'milestone' | 'achievement' | 'social' | 'special';
export type MatchFormatType = 'one_set' | 'two_sets' | 'three_sets' | 'super_tiebreak';

export type ChatRoom = typeof chatRooms.$inferSelect;
export type NewChatRoom = typeof chatRooms.$inferInsert;

export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;
export type NewChatRoomMember = typeof chatRoomMembers.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type ClubJoinRequest = typeof clubJoinRequests.$inferSelect;
export type NewClubJoinRequest = typeof clubJoinRequests.$inferInsert;

export type ClubCreationRequest = typeof clubCreationRequests.$inferSelect;
export type NewClubCreationRequest = typeof clubCreationRequests.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;

export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type NewTournamentParticipant = typeof tournamentParticipants.$inferInsert;

export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type NewTournamentMatch = typeof tournamentMatches.$inferInsert;

export type TournamentStatus = 'draft' | 'registration' | 'seeding' | 'active' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'consolation';

export type MatchRating = typeof matchRatings.$inferSelect;
export type NewMatchRating = typeof matchRatings.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

export type PlayerWeeklyActivity = typeof playerWeeklyActivity.$inferSelect;
export type NewPlayerWeeklyActivity = typeof playerWeeklyActivity.$inferInsert;

export type DirectConversation = typeof directConversations.$inferSelect;
export type NewDirectConversation = typeof directConversations.$inferInsert;

export type DirectMessage = typeof directMessages.$inferSelect;
export type NewDirectMessage = typeof directMessages.$inferInsert;
