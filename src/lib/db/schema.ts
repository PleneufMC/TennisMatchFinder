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
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
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
    isAdmin: boolean('is_admin').default(false).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
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
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('matches_club_id_idx').on(table.clubId),
    player1IdIdx: index('matches_player1_id_idx').on(table.player1Id),
    player2IdIdx: index('matches_player2_id_idx').on(table.player2Id),
    playedAtIdx: index('matches_played_at_idx').on(table.playedAt),
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

// Player Badges
export const playerBadges = pgTable(
  'player_badges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    badgeType: varchar('badge_type', { length: 50 }).notNull(),
    badgeName: varchar('badge_name', { length: 100 }).notNull(),
    badgeDescription: text('badge_description'),
    badgeIcon: varchar('badge_icon', { length: 50 }),
    earnedAt: timestamp('earned_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    playerIdIdx: index('player_badges_player_id_idx').on(table.playerId),
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
    isDirect: boolean('is_direct').default(false).notNull(), // true = conversation privée
    isGroup: boolean('is_group').default(false).notNull(),   // true = conversation de groupe
    createdBy: uuid('created_by').references(() => players.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('chat_rooms_club_id_idx').on(table.clubId),
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
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  player: one(players, {
    fields: [users.id],
    references: [players.id],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  players: many(players),
  matches: many(matches),
  forumThreads: many(forumThreads),
  matchProposals: many(matchProposals),
  chatRooms: many(chatRooms),
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

// ============================================
// TYPE EXPORTS
// ============================================

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

export type PlayerBadge = typeof playerBadges.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type ChatRoom = typeof chatRooms.$inferSelect;
export type NewChatRoom = typeof chatRooms.$inferInsert;

export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;
export type NewChatRoomMember = typeof chatRoomMembers.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
