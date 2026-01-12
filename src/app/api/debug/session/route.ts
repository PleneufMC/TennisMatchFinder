/**
 * API Route: Debug - Check current session
 * GET /api/debug/session
 * 
 * TEMPORARY - Remove after debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Only allow with special header
  const debugKey = request.headers.get('x-debug-key');
  if (debugKey !== 'tmf-debug-2026') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        hasPlayer: !!session.user?.player,
        player: session.user?.player ? {
          id: session.user.player.id,
          fullName: session.user.player.fullName,
          clubId: session.user.player.clubId,
        } : null,
      } : null,
    });
  } catch (error) {
    console.error('Session debug error:', error);
    return NextResponse.json({ 
      error: 'Session error',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
