/**
 * API Route: Debug - Check user and player status
 * GET /api/debug/user?email=xxx
 * 
 * TEMPORARY - Remove after debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Only allow in development or with special header
  const debugKey = request.headers.get('x-debug-key');
  if (process.env.NODE_ENV === 'production' && debugKey !== 'tmf-debug-2026') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        found: false,
        message: 'User not found',
        email: email.toLowerCase(),
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
