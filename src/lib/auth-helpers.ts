import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, clubs, users, type Player, type Club } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

/**
 * Player with club data type
 * BUG-002 FIX: club can be null if player has no club yet
 */
export type PlayerWithClub = Player & {
  club: Club | null;
};

/**
 * Get the current session on the server
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Player profile with club data
 */
export type PlayerProfile = typeof players.$inferSelect & {
  club: typeof clubs.$inferSelect;
  user: typeof users.$inferSelect;
};

/**
 * Player profile with optional club data
 * BUG-002 FIX: club can be null
 */
export type PlayerProfileWithOptionalClub = typeof players.$inferSelect & {
  club: typeof clubs.$inferSelect | null;
  user: typeof users.$inferSelect;
};

/**
 * Get the current player profile with club data
 * BUG-002 FIX: Use LEFT JOIN instead of INNER JOIN to handle players without a club
 */
export async function getPlayerProfile(): Promise<PlayerProfileWithOptionalClub | null> {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return null;
  }

  // Use LEFT JOIN to include players even if they don't have a club
  const result = await db
    .select({
      players: players,
      clubs: clubs,
      users: users,
    })
    .from(players)
    .leftJoin(clubs, eq(players.clubId, clubs.id))
    .innerJoin(users, eq(players.id, users.id))
    .where(eq(players.id, session.user.id))
    .limit(1);

  const row = result[0];
  if (!row) {
    return null;
  }

  return {
    ...row.players,
    club: row.clubs,  // Can be null if player has no club
    user: row.users,
  };
}

/**
 * Get a player by ID with club data
 * BUG-002 FIX: Use LEFT JOIN to handle players without a club
 */
export async function getPlayerById(playerId: string): Promise<PlayerProfileWithOptionalClub | null> {
  const result = await db
    .select({
      players: players,
      clubs: clubs,
      users: users,
    })
    .from(players)
    .leftJoin(clubs, eq(players.clubId, clubs.id))
    .innerJoin(users, eq(players.id, users.id))
    .where(eq(players.id, playerId))
    .limit(1);

  const row = result[0];
  if (!row) {
    return null;
  }

  return {
    ...row.players,
    club: row.clubs,  // Can be null if player has no club
    user: row.users,
  };
}

/**
 * Check if user has a player profile
 */
export async function hasPlayerProfile(): Promise<boolean> {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return false;
  }

  const result = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.id, session.user.id))
    .limit(1);

  return result.length > 0;
}

/**
 * Check if user is admin of their club
 */
export async function isClubAdmin(): Promise<boolean> {
  const profile = await getPlayerProfile();
  return profile?.isAdmin ?? false;
}

/**
 * Alias for getPlayerProfile - used in pages
 * Returns player with club data or null
 * BUG-002 FIX: Use LEFT JOIN instead of INNER JOIN to handle players without a club
 * This prevents authenticated users without a club from being treated as unauthenticated
 */
export async function getServerPlayer(): Promise<PlayerWithClub | null> {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return null;
  }

  // BUG-002 FIX: Use LEFT JOIN to include players even if clubId is null
  const result = await db
    .select({
      player: players,
      club: clubs,
    })
    .from(players)
    .leftJoin(clubs, eq(players.clubId, clubs.id))
    .where(eq(players.id, session.user.id))
    .limit(1);

  const row = result[0];
  if (!row) {
    return null;
  }

  return {
    ...row.player,
    club: row.club,  // Can be null if player has no club
  };
}
