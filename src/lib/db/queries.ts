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
