/**
 * Database queries using Drizzle ORM
 */

import { db } from './index';
import {
  players,
  clubs,
  users,
  matches,
  eloHistory,
  matchProposals,
  forumThreads,
  forumReplies,
  playerBadges,
  notifications,
  type Player,
  type Match,
  type EloHistory,
  type MatchProposal,
  type ForumThread,
  type PlayerBadge,
} from './schema';
import { eq, and, or, desc, asc, sql, count, inArray } from 'drizzle-orm';

// ============================================
// PLAYER QUERIES
// ============================================

export async function getPlayersByClub(clubId: string, options?: { 
  activeOnly?: boolean;
  orderBy?: 'elo' | 'name' | 'matches';
}): Promise<Player[]> {
  // Build where condition based on options
  const whereCondition = options?.activeOnly !== false
    ? and(eq(players.clubId, clubId), eq(players.isActive, true))
    : eq(players.clubId, clubId);
  
  const result = await db
    .select()
    .from(players)
    .where(whereCondition);
  
  // Sort in JS since Drizzle doesn't support dynamic orderBy easily
  if (options?.orderBy === 'elo') {
    result.sort((a, b) => b.currentElo - a.currentElo);
  } else if (options?.orderBy === 'name') {
    result.sort((a, b) => a.fullName.localeCompare(b.fullName));
  } else if (options?.orderBy === 'matches') {
    result.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
  }

  return result;
}

export async function getPlayerById(playerId: string): Promise<Player | null> {
  const result = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);
  
  return result[0] ?? null;
}

export async function getPlayerWithClub(playerId: string) {
  const result = await db
    .select({
      player: players,
      club: clubs,
      user: users,
    })
    .from(players)
    .innerJoin(clubs, eq(players.clubId, clubs.id))
    .innerJoin(users, eq(players.id, users.id))
    .where(eq(players.id, playerId))
    .limit(1);
  
  const row = result[0];
  if (!row) return null;
  
  return {
    ...row.player,
    club: row.club,
    user: row.user,
  };
}

// ============================================
// MATCH QUERIES
// ============================================

export async function getMatchesByPlayer(
  playerId: string,
  options?: { limit?: number }
): Promise<(Match & { player1: Player; player2: Player })[]> {
  const result = await db
    .select()
    .from(matches)
    .where(or(eq(matches.player1Id, playerId), eq(matches.player2Id, playerId)))
    .orderBy(desc(matches.playedAt))
    .limit(options?.limit ?? 50);

  // Fetch player details
  const playerIds = [...new Set(result.flatMap(m => [m.player1Id, m.player2Id]))];
  const playersData = await db
    .select()
    .from(players)
    .where(inArray(players.id, playerIds));
  
  const playersMap = new Map(playersData.map(p => [p.id, p]));

  return result.map(match => ({
    ...match,
    player1: playersMap.get(match.player1Id)!,
    player2: playersMap.get(match.player2Id)!,
  }));
}

export async function getMatchesByClub(
  clubId: string,
  options?: { limit?: number; since?: Date }
): Promise<Match[]> {
  return db
    .select()
    .from(matches)
    .where(eq(matches.clubId, clubId))
    .orderBy(desc(matches.playedAt))
    .limit(options?.limit ?? 100);
}

// ============================================
// ELO HISTORY QUERIES
// ============================================

export async function getEloHistoryByPlayer(
  playerId: string,
  options?: { limit?: number }
): Promise<EloHistory[]> {
  return db
    .select()
    .from(eloHistory)
    .where(eq(eloHistory.playerId, playerId))
    .orderBy(desc(eloHistory.recordedAt))
    .limit(options?.limit ?? 50);
}

// ============================================
// MATCH PROPOSAL QUERIES
// ============================================

export async function getPendingProposalsForPlayer(
  playerId: string,
  options?: { limit?: number }
): Promise<(MatchProposal & { fromPlayer: Player })[]> {
  const result = await db
    .select()
    .from(matchProposals)
    .where(
      and(
        eq(matchProposals.toPlayerId, playerId),
        eq(matchProposals.status, 'pending')
      )
    )
    .orderBy(desc(matchProposals.createdAt))
    .limit(options?.limit ?? 10);

  // Fetch from player details
  const fromPlayerIds = [...new Set(result.map(p => p.fromPlayerId))];
  const playersData = await db
    .select()
    .from(players)
    .where(inArray(players.id, fromPlayerIds));
  
  const playersMap = new Map(playersData.map(p => [p.id, p]));

  return result.map(proposal => ({
    ...proposal,
    fromPlayer: playersMap.get(proposal.fromPlayerId)!,
  }));
}

export async function getSentProposalsByPlayer(
  playerId: string,
  options?: { limit?: number }
): Promise<MatchProposal[]> {
  return db
    .select()
    .from(matchProposals)
    .where(eq(matchProposals.fromPlayerId, playerId))
    .orderBy(desc(matchProposals.createdAt))
    .limit(options?.limit ?? 10);
}

// ============================================
// FORUM QUERIES
// ============================================

export async function getForumThreadsByClub(
  clubId: string,
  options?: { category?: string; limit?: number }
): Promise<(ForumThread & { author: Player | null })[]> {
  let whereClause = eq(forumThreads.clubId, clubId);
  
  if (options?.category) {
    whereClause = and(whereClause, eq(forumThreads.category, options.category as any))!;
  }

  const result = await db
    .select()
    .from(forumThreads)
    .where(whereClause)
    .orderBy(desc(forumThreads.isPinned), desc(forumThreads.createdAt))
    .limit(options?.limit ?? 50);

  // Fetch author details
  const authorIds = [...new Set(result.map(t => t.authorId).filter(Boolean))] as string[];
  const authorsData = authorIds.length > 0 
    ? await db.select().from(players).where(inArray(players.id, authorIds))
    : [];
  
  const authorsMap = new Map(authorsData.map(p => [p.id, p]));

  return result.map(thread => ({
    ...thread,
    author: thread.authorId ? authorsMap.get(thread.authorId) ?? null : null,
  }));
}

export async function getThreadCategoryCount(clubId: string): Promise<Record<string, number>> {
  const result = await db
    .select({
      category: forumThreads.category,
      count: count(),
    })
    .from(forumThreads)
    .where(eq(forumThreads.clubId, clubId))
    .groupBy(forumThreads.category);

  return Object.fromEntries(result.map(r => [r.category, r.count]));
}

// ============================================
// BADGE QUERIES
// ============================================

export async function getBadgesByPlayer(playerId: string): Promise<PlayerBadge[]> {
  return db
    .select()
    .from(playerBadges)
    .where(eq(playerBadges.playerId, playerId))
    .orderBy(desc(playerBadges.earnedAt));
}

// ============================================
// RANKING QUERIES
// ============================================

export async function getClubRanking(clubId: string): Promise<Player[]> {
  return db
    .select()
    .from(players)
    .where(and(eq(players.clubId, clubId), eq(players.isActive, true)))
    .orderBy(desc(players.currentElo));
}

// ============================================
// CLUB QUERIES
// ============================================

export async function getClubBySlug(slug: string) {
  const result = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.slug, slug), eq(clubs.isActive, true)))
    .limit(1);
  
  return result[0] ?? null;
}

export async function getClubById(id: string) {
  const result = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, id))
    .limit(1);
  
  return result[0] ?? null;
}

export async function getAllClubs(options?: { activeOnly?: boolean }) {
  if (options?.activeOnly) {
    return db
      .select()
      .from(clubs)
      .where(eq(clubs.isActive, true))
      .orderBy(clubs.name);
  }
  return db.select().from(clubs).orderBy(clubs.name);
}

export async function createClub(data: {
  name: string;
  slug: string;
  description?: string;
  contactEmail?: string;
  websiteUrl?: string;
  address?: string;
}) {
  const [newClub] = await db
    .insert(clubs)
    .values({
      name: data.name,
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: data.description,
      contactEmail: data.contactEmail,
      websiteUrl: data.websiteUrl,
      address: data.address,
      isActive: true,
    })
    .returning();

  if (!newClub) {
    throw new Error('Failed to create club');
  }

  return newClub;
}

export async function updateClub(
  clubId: string,
  data: {
    name?: string;
    description?: string;
    contactEmail?: string;
    websiteUrl?: string;
    address?: string;
    isActive?: boolean;
  }
) {
  const [updatedClub] = await db
    .update(clubs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(clubs.id, clubId))
    .returning();

  if (!updatedClub) {
    throw new Error('Failed to update club');
  }

  return updatedClub;
}

export async function getClubStats(clubId: string) {
  const playersCount = await db
    .select({ count: count() })
    .from(players)
    .where(and(eq(players.clubId, clubId), eq(players.isActive, true)));

  const matchesCount = await db
    .select({ count: count() })
    .from(matches)
    .where(eq(matches.clubId, clubId));

  return {
    playersCount: playersCount[0]?.count ?? 0,
    matchesCount: matchesCount[0]?.count ?? 0,
  };
}

// ============================================
// CHAT QUERIES
// ============================================

import {
  chatRooms,
  chatRoomMembers,
  chatMessages,
  type ChatRoom,
  type ChatMessage,
} from './schema';

export async function getChatRoomsForPlayer(
  playerId: string
): Promise<(ChatRoom & { lastMessage?: ChatMessage; unreadCount: number; members: Player[] })[]> {
  // Get all chat rooms where the player is a member
  const memberRooms = await db
    .select({ roomId: chatRoomMembers.roomId, lastReadAt: chatRoomMembers.lastReadAt })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.playerId, playerId));

  if (memberRooms.length === 0) return [];

  const roomIds = memberRooms.map(m => m.roomId);
  const lastReadMap = new Map(memberRooms.map(m => [m.roomId, m.lastReadAt]));

  // Get room details
  const rooms = await db
    .select()
    .from(chatRooms)
    .where(inArray(chatRooms.id, roomIds))
    .orderBy(desc(chatRooms.updatedAt));

  // Get all members for these rooms
  const allMembers = await db
    .select()
    .from(chatRoomMembers)
    .where(inArray(chatRoomMembers.roomId, roomIds));

  const playerIdsInRooms = [...new Set(allMembers.map(m => m.playerId))];
  const playersData = playerIdsInRooms.length > 0
    ? await db.select().from(players).where(inArray(players.id, playerIdsInRooms))
    : [];
  const playersMap = new Map(playersData.map(p => [p.id, p]));

  // Get last message for each room
  const lastMessages: Record<string, ChatMessage> = {};
  for (const roomId of roomIds) {
    const lastMsg = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);
    if (lastMsg[0]) {
      lastMessages[roomId] = lastMsg[0];
    }
  }

  // Count unread messages for each room
  const unreadCounts: Record<string, number> = {};
  for (const roomId of roomIds) {
    const lastRead = lastReadMap.get(roomId);
    const whereClause = lastRead
      ? and(eq(chatMessages.roomId, roomId), sql`${chatMessages.createdAt} > ${lastRead}`)
      : eq(chatMessages.roomId, roomId);
    
    const result = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(whereClause);
    
    unreadCounts[roomId] = result[0]?.count ?? 0;
  }

  return rooms.map(room => ({
    ...room,
    lastMessage: lastMessages[room.id],
    unreadCount: unreadCounts[room.id] ?? 0,
    members: allMembers
      .filter(m => m.roomId === room.id)
      .map(m => playersMap.get(m.playerId)!)
      .filter(Boolean),
  }));
}

export async function getChatMessages(
  roomId: string,
  options?: { limit?: number; before?: Date }
): Promise<(ChatMessage & { sender: Player | null })[]> {
  const whereClause = options?.before
    ? and(eq(chatMessages.roomId, roomId), sql`${chatMessages.createdAt} < ${options.before}`)
    : eq(chatMessages.roomId, roomId);

  const result = await db
    .select()
    .from(chatMessages)
    .where(whereClause)
    .orderBy(desc(chatMessages.createdAt))
    .limit(options?.limit ?? 50);

  // Fetch sender details
  const senderIds = [...new Set(result.map(m => m.senderId).filter(Boolean))] as string[];
  const sendersData = senderIds.length > 0
    ? await db.select().from(players).where(inArray(players.id, senderIds))
    : [];
  
  const sendersMap = new Map(sendersData.map(p => [p.id, p]));

  return result.reverse().map(msg => ({
    ...msg,
    sender: msg.senderId ? sendersMap.get(msg.senderId) ?? null : null,
  }));
}

export async function getOrCreateDirectChat(
  clubId: string,
  player1Id: string,
  player2Id: string
): Promise<ChatRoom> {
  // Check if a direct chat already exists between these two players
  const existingMembers = await db
    .select()
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.playerId, player1Id));

  for (const member of existingMembers) {
    const room = await db
      .select()
      .from(chatRooms)
      .where(and(eq(chatRooms.id, member.roomId), eq(chatRooms.isDirect, true)))
      .limit(1);

    if (room[0]) {
      const otherMember = await db
        .select()
        .from(chatRoomMembers)
        .where(and(eq(chatRoomMembers.roomId, member.roomId), eq(chatRoomMembers.playerId, player2Id)))
        .limit(1);

      if (otherMember[0]) {
        return room[0];
      }
    }
  }

  // Create a new direct chat room
  const [newRoom] = await db
    .insert(chatRooms)
    .values({
      clubId,
      isDirect: true,
      isGroup: false,
      createdBy: player1Id,
    })
    .returning();

  if (!newRoom) {
    throw new Error('Failed to create chat room');
  }

  // Add both players as members
  await db.insert(chatRoomMembers).values([
    { roomId: newRoom.id, playerId: player1Id },
    { roomId: newRoom.id, playerId: player2Id },
  ]);

  return newRoom;
}

export async function sendChatMessage(
  roomId: string,
  senderId: string,
  content: string,
  messageType: string = 'text'
): Promise<ChatMessage> {
  const [message] = await db
    .insert(chatMessages)
    .values({
      roomId,
      senderId,
      content,
      messageType,
    })
    .returning();

  if (!message) {
    throw new Error('Failed to send message');
  }

  // Update room's updatedAt
  await db
    .update(chatRooms)
    .set({ updatedAt: new Date() })
    .where(eq(chatRooms.id, roomId));

  return message;
}

export async function markChatAsRead(roomId: string, playerId: string): Promise<void> {
  await db
    .update(chatRoomMembers)
    .set({ lastReadAt: new Date() })
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.playerId, playerId)));
}

export async function getChatRoomById(roomId: string): Promise<ChatRoom | null> {
  const result = await db
    .select()
    .from(chatRooms)
    .where(eq(chatRooms.id, roomId))
    .limit(1);
  
  return result[0] ?? null;
}

export async function isPlayerInChatRoom(roomId: string, playerId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(chatRoomMembers)
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.playerId, playerId)))
    .limit(1);
  
  return result.length > 0;
}

// ============================================
// CLUB SECTION QUERIES
// ============================================

export async function getClubSections(
  clubId: string
): Promise<(ChatRoom & { lastMessage?: ChatMessage; unreadCount: number; memberCount: number })[]> {
  // Get all section rooms for the club
  const sections = await db
    .select()
    .from(chatRooms)
    .where(and(eq(chatRooms.clubId, clubId), eq(chatRooms.isSection, true)))
    .orderBy(chatRooms.sectionOrder);

  if (sections.length === 0) return [];

  // Get last message and unread count for each section
  const result: (ChatRoom & { lastMessage?: ChatMessage; unreadCount: number; memberCount: number })[] = [];
  
  for (const section of sections) {
    // Get last message
    const lastMsg = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, section.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);

    // Count members
    const memberCountResult = await db
      .select({ count: count() })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.roomId, section.id));

    result.push({
      ...section,
      lastMessage: lastMsg[0],
      unreadCount: 0, // Sections don't track unread per user by default
      memberCount: memberCountResult[0]?.count ?? 0,
    });
  }

  return result;
}

// Type enrichi pour lastMessage avec senderName
export type LastMessageWithSender = ChatMessage & { senderName?: string };

export async function getClubSectionsWithUnread(
  clubId: string,
  playerId: string
): Promise<(ChatRoom & { lastMessage?: LastMessageWithSender; unreadCount: number; memberCount: number })[]> {
  // Get all section rooms for the club
  const sections = await db
    .select()
    .from(chatRooms)
    .where(and(eq(chatRooms.clubId, clubId), eq(chatRooms.isSection, true)))
    .orderBy(chatRooms.sectionOrder);

  if (sections.length === 0) return [];

  const result: (ChatRoom & { lastMessage?: LastMessageWithSender; unreadCount: number; memberCount: number })[] = [];
  
  for (const section of sections) {
    // Get last message with sender name
    const lastMsgWithSender = await db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        messageType: chatMessages.messageType,
        metadata: chatMessages.metadata,
        isEdited: chatMessages.isEdited,
        editedAt: chatMessages.editedAt,
        createdAt: chatMessages.createdAt,
        senderName: players.fullName,
      })
      .from(chatMessages)
      .leftJoin(players, eq(chatMessages.senderId, players.id))
      .where(eq(chatMessages.roomId, section.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);

    // Get player's last read timestamp for this section
    const memberInfo = await db
      .select({ lastReadAt: chatRoomMembers.lastReadAt })
      .from(chatRoomMembers)
      .where(and(eq(chatRoomMembers.roomId, section.id), eq(chatRoomMembers.playerId, playerId)))
      .limit(1);

    const lastRead = memberInfo[0]?.lastReadAt;

    // Count unread messages
    let unreadCount = 0;
    if (lastRead) {
      const unreadResult = await db
        .select({ count: count() })
        .from(chatMessages)
        .where(and(eq(chatMessages.roomId, section.id), sql`${chatMessages.createdAt} > ${lastRead}`));
      unreadCount = unreadResult[0]?.count ?? 0;
    } else {
      // If player hasn't joined the section yet, count all messages as unread
      const totalResult = await db
        .select({ count: count() })
        .from(chatMessages)
        .where(eq(chatMessages.roomId, section.id));
      unreadCount = totalResult[0]?.count ?? 0;
    }

    // Count members
    const memberCountResult = await db
      .select({ count: count() })
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.roomId, section.id));

    result.push({
      ...section,
      lastMessage: lastMsgWithSender[0] as LastMessageWithSender | undefined,
      unreadCount,
      memberCount: memberCountResult[0]?.count ?? 0,
    });
  }

  return result;
}

export async function joinClubSection(roomId: string, playerId: string): Promise<void> {
  // Check if already a member
  const existing = await db
    .select()
    .from(chatRoomMembers)
    .where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.playerId, playerId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(chatRoomMembers).values({
      roomId,
      playerId,
      lastReadAt: new Date(),
    });
  }
}

export async function createClubSection(
  clubId: string,
  name: string,
  description?: string,
  icon?: string,
  order?: number
): Promise<ChatRoom> {
  // Get the max order if not provided
  let sectionOrder = order;
  if (sectionOrder === undefined) {
    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${chatRooms.sectionOrder}), 0)` })
      .from(chatRooms)
      .where(and(eq(chatRooms.clubId, clubId), eq(chatRooms.isSection, true)));
    sectionOrder = (maxOrderResult[0]?.maxOrder ?? 0) + 1;
  }

  const [newSection] = await db
    .insert(chatRooms)
    .values({
      clubId,
      name,
      description,
      icon,
      isSection: true,
      isGroup: true,
      sectionOrder,
    })
    .returning();

  if (!newSection) {
    throw new Error('Failed to create club section');
  }

  return newSection;
}

export async function createDefaultClubSections(clubId: string): Promise<ChatRoom[]> {
  const defaultSections = [
    { name: 'Général', description: 'Discussions générales du club', icon: '💬', order: 1 },
    { name: 'Annonces', description: 'Annonces officielles du club', icon: '📢', order: 2 },
    { name: 'Recherche partenaires', description: 'Trouvez un partenaire pour jouer', icon: '🎾', order: 3 },
    { name: 'Résultats', description: 'Partagez vos résultats de matchs', icon: '🏆', order: 4 },
    { name: 'Équipement', description: 'Discussions sur le matériel et équipement', icon: '🏸', order: 5 },
  ];

  const createdSections: ChatRoom[] = [];

  for (const section of defaultSections) {
    // Check if section already exists
    const existing = await db
      .select()
      .from(chatRooms)
      .where(and(
        eq(chatRooms.clubId, clubId),
        eq(chatRooms.isSection, true),
        eq(chatRooms.name, section.name)
      ))
      .limit(1);

    if (existing.length === 0) {
      const newSection = await createClubSection(
        clubId,
        section.name,
        section.description,
        section.icon,
        section.order
      );
      createdSections.push(newSection);
    }
  }

  return createdSections;
}

// ============================================
// CLUB JOIN REQUEST QUERIES
// ============================================

import {
  clubJoinRequests,
  type ClubJoinRequest,
  type User,
} from './schema';

export async function createJoinRequest(data: {
  clubId: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
  selfAssessedLevel?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
}): Promise<ClubJoinRequest> {
  const [request] = await db
    .insert(clubJoinRequests)
    .values({
      clubId: data.clubId,
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      message: data.message,
      selfAssessedLevel: data.selfAssessedLevel || 'intermédiaire',
    })
    .returning();

  if (!request) {
    throw new Error('Failed to create join request');
  }

  return request;
}

export async function getPendingJoinRequests(
  clubId: string
): Promise<(ClubJoinRequest & { user: User })[]> {
  const result = await db
    .select()
    .from(clubJoinRequests)
    .where(and(eq(clubJoinRequests.clubId, clubId), eq(clubJoinRequests.status, 'pending')))
    .orderBy(desc(clubJoinRequests.createdAt));

  // Fetch user details
  const userIds = result.map(r => r.userId);
  const usersData = userIds.length > 0
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  
  const usersMap = new Map(usersData.map(u => [u.id, u]));

  return result.map(request => ({
    ...request,
    user: usersMap.get(request.userId)!,
  }));
}

export async function getAllJoinRequests(
  clubId: string,
  options?: { status?: 'pending' | 'approved' | 'rejected'; limit?: number }
): Promise<(ClubJoinRequest & { user: User })[]> {
  let whereClause = eq(clubJoinRequests.clubId, clubId);
  
  if (options?.status) {
    whereClause = and(whereClause, eq(clubJoinRequests.status, options.status))!;
  }

  const result = await db
    .select()
    .from(clubJoinRequests)
    .where(whereClause)
    .orderBy(desc(clubJoinRequests.createdAt))
    .limit(options?.limit ?? 100);

  // Fetch user details
  const userIds = result.map(r => r.userId);
  const usersData = userIds.length > 0
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  
  const usersMap = new Map(usersData.map(u => [u.id, u]));

  return result.map(request => ({
    ...request,
    user: usersMap.get(request.userId)!,
  }));
}

export async function getJoinRequestByUserAndClub(
  userId: string,
  clubId: string
): Promise<ClubJoinRequest | null> {
  const result = await db
    .select()
    .from(clubJoinRequests)
    .where(and(eq(clubJoinRequests.userId, userId), eq(clubJoinRequests.clubId, clubId)))
    .orderBy(desc(clubJoinRequests.createdAt))
    .limit(1);
  
  return result[0] ?? null;
}

export async function approveJoinRequest(
  requestId: string,
  reviewerId: string
): Promise<{ request: ClubJoinRequest; player: Player }> {
  // Get the request
  const [request] = await db
    .select()
    .from(clubJoinRequests)
    .where(eq(clubJoinRequests.id, requestId))
    .limit(1);

  if (!request) {
    throw new Error('Demande non trouvée');
  }

  if (request.status !== 'pending') {
    throw new Error('Cette demande a déjà été traitée');
  }

  // Update request status
  const [updatedRequest] = await db
    .update(clubJoinRequests)
    .set({
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clubJoinRequests.id, requestId))
    .returning();

  if (!updatedRequest) {
    throw new Error('Failed to update join request');
  }

  // Create player profile
  const [player] = await db
    .insert(players)
    .values({
      id: request.userId,
      clubId: request.clubId,
      fullName: request.fullName,
      phone: request.phone,
      selfAssessedLevel: request.selfAssessedLevel,
      isVerified: true,
      isActive: true,
    })
    .returning();

  if (!player) {
    throw new Error('Failed to create player profile');
  }

  return { request: updatedRequest, player };
}

export async function rejectJoinRequest(
  requestId: string,
  reviewerId: string,
  reason?: string
): Promise<ClubJoinRequest> {
  const [updatedRequest] = await db
    .update(clubJoinRequests)
    .set({
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(clubJoinRequests.id, requestId))
    .returning();

  if (!updatedRequest) {
    throw new Error('Failed to reject join request');
  }

  return updatedRequest;
}

export async function countPendingJoinRequests(clubId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(clubJoinRequests)
    .where(and(eq(clubJoinRequests.clubId, clubId), eq(clubJoinRequests.status, 'pending')));
  
  return result[0]?.count ?? 0;
}

export async function hasUserPendingRequest(userId: string, clubId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(clubJoinRequests)
    .where(and(
      eq(clubJoinRequests.userId, userId),
      eq(clubJoinRequests.clubId, clubId),
      eq(clubJoinRequests.status, 'pending')
    ))
    .limit(1);
  
  return result.length > 0;
}
