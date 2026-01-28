/**
 * Block Service
 * 
 * Helper functions for checking and filtering blocked players
 */

import { db } from '@/lib/db';
import { playerBlocks } from '@/lib/db/schema';
import { eq, or, inArray } from 'drizzle-orm';

/**
 * Get all player IDs that a user has blocked
 */
export async function getBlockedPlayerIds(playerId: string): Promise<string[]> {
  const blocks = await db
    .select({ blockedId: playerBlocks.blockedId })
    .from(playerBlocks)
    .where(eq(playerBlocks.blockerId, playerId));
  
  return blocks.map(b => b.blockedId);
}

/**
 * Get all player IDs that have blocked a user
 */
export async function getBlockerPlayerIds(playerId: string): Promise<string[]> {
  const blocks = await db
    .select({ blockerId: playerBlocks.blockerId })
    .from(playerBlocks)
    .where(eq(playerBlocks.blockedId, playerId));
  
  return blocks.map(b => b.blockerId);
}

/**
 * Get all player IDs involved in any block relationship with a user
 * (either blocked by the user or has blocked the user)
 */
export async function getAllBlockedRelationshipIds(playerId: string): Promise<string[]> {
  const blocks = await db
    .select({
      blockerId: playerBlocks.blockerId,
      blockedId: playerBlocks.blockedId,
    })
    .from(playerBlocks)
    .where(
      or(
        eq(playerBlocks.blockerId, playerId),
        eq(playerBlocks.blockedId, playerId)
      )
    );
  
  const ids = new Set<string>();
  for (const block of blocks) {
    if (block.blockerId !== playerId) ids.add(block.blockerId);
    if (block.blockedId !== playerId) ids.add(block.blockedId);
  }
  
  return Array.from(ids);
}

/**
 * Check if player A has blocked player B
 */
export async function hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const [block] = await db
    .select()
    .from(playerBlocks)
    .where(
      eq(playerBlocks.blockerId, blockerId)
    )
    .limit(1);
  
  return !!block;
}

/**
 * Check if there's any block relationship between two players
 */
export async function isBlocked(playerA: string, playerB: string): Promise<boolean> {
  const [block] = await db
    .select()
    .from(playerBlocks)
    .where(
      or(
        eq(playerBlocks.blockerId, playerA),
        eq(playerBlocks.blockedId, playerA)
      )
    )
    .limit(1);
  
  if (!block) return false;
  
  return (block.blockerId === playerA && block.blockedId === playerB) ||
         (block.blockerId === playerB && block.blockedId === playerA);
}

/**
 * Filter out blocked players from a list
 */
export function filterBlockedPlayers<T extends { id: string }>(
  players: T[],
  blockedIds: string[]
): T[] {
  const blockedSet = new Set(blockedIds);
  return players.filter(p => !blockedSet.has(p.id));
}
