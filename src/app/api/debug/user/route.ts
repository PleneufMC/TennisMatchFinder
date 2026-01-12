/**
 * API Route: Debug - Check user and player status
 * GET /api/debug/user?email=xxx
 * GET /api/debug/user?name=xxx (search by player name)
 * 
 * TEMPORARY - Remove after debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, players } from '@/lib/db/schema';
import { eq, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Only allow in development or with special header
  const debugKey = request.headers.get('x-debug-key');
  if (process.env.NODE_ENV === 'production' && debugKey !== 'tmf-debug-2026') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const email = request.nextUrl.searchParams.get('email');
  const name = request.nextUrl.searchParams.get('name');
  
  if (!email && !name) {
    return NextResponse.json({ error: 'Email or name required' }, { status: 400 });
  }

  try {
    // Search by name in players table
    if (name) {
      const playerResults = await db
        .select()
        .from(players)
        .where(ilike(players.fullName, `%${name}%`))
        .limit(5);

      if (playerResults.length === 0) {
        return NextResponse.json({
          found: false,
          message: 'No players found with that name',
          searchedName: name,
        });
      }

      // For each player, find the associated user
      const results = await Promise.all(
        playerResults.map(async (player) => {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, player.id))
            .limit(1);
          
          return {
            player: {
              id: player.id,
              fullName: player.fullName,
              city: player.city,
              currentElo: player.currentElo,
              clubId: player.clubId,
              isAdmin: player.isAdmin,
            },
            user: user ? {
              id: user.id,
              email: user.email,
              name: user.name,
              emailVerified: user.emailVerified,
            } : null,
            hasUser: !!user,
          };
        })
      );

      return NextResponse.json({
        found: true,
        count: results.length,
        results,
      });
    }

    // Search by email in users table
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email!.toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        found: false,
        message: 'User not found in users table',
        email: email!.toLowerCase(),
      });
    }

    // Find player
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, user.id))
      .limit(1);

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      hasPlayer: !!player,
      player: player ? {
        id: player.id,
        fullName: player.fullName,
        city: player.city,
        currentElo: player.currentElo,
        clubId: player.clubId,
        isAdmin: player.isAdmin,
      } : null,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
