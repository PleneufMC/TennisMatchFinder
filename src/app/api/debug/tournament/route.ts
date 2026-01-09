/**
 * Debug endpoint pour tester l'API tournaments étape par étape
 * GET /api/debug/tournament?id=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, tournaments, tournamentParticipants, tournamentMatches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const debugSteps: Record<string, any> = {
    timestamp: new Date().toISOString(),
    steps: [],
  };

  try {
    // Step 1: Check DB connection
    debugSteps.steps.push({ step: 1, name: 'DB Connection', status: 'starting' });
    const dbTest = await db.execute('SELECT 1 as test');
    debugSteps.steps[0].status = 'success';
    debugSteps.steps[0].result = 'Connected';

    // Step 2: Check session
    debugSteps.steps.push({ step: 2, name: 'Session Check', status: 'starting' });
    let session;
    try {
      session = await getServerSession(authOptions);
      debugSteps.steps[1].status = session ? 'success' : 'no_session';
      debugSteps.steps[1].userId = session?.user?.id || null;
    } catch (sessionError: any) {
      debugSteps.steps[1].status = 'error';
      debugSteps.steps[1].error = sessionError.message;
    }

    // Step 3: Get tournament ID from query
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get('id') || 'a81b5e26-58e4-4322-b3ac-9cd65a8ffc18';
    debugSteps.tournamentId = tournamentId;

    // Step 4: Fetch tournament
    debugSteps.steps.push({ step: 4, name: 'Fetch Tournament', status: 'starting' });
    try {
      const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .limit(1);
      
      if (tournament) {
        debugSteps.steps[2].status = 'success';
        debugSteps.steps[2].tournament = {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status,
          clubId: tournament.clubId,
        };
      } else {
        debugSteps.steps[2].status = 'not_found';
      }
    } catch (tournamentError: any) {
      debugSteps.steps[2].status = 'error';
      debugSteps.steps[2].error = tournamentError.message;
    }

    // Step 5: Fetch participants count
    debugSteps.steps.push({ step: 5, name: 'Fetch Participants', status: 'starting' });
    try {
      const participants = await db
        .select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournamentId));
      
      debugSteps.steps[3].status = 'success';
      debugSteps.steps[3].count = participants.length;
    } catch (participantsError: any) {
      debugSteps.steps[3].status = 'error';
      debugSteps.steps[3].error = participantsError.message;
    }

    // Step 6: Fetch matches count
    debugSteps.steps.push({ step: 6, name: 'Fetch Matches', status: 'starting' });
    try {
      const matches = await db
        .select()
        .from(tournamentMatches)
        .where(eq(tournamentMatches.tournamentId, tournamentId));
      
      debugSteps.steps[4].status = 'success';
      debugSteps.steps[4].count = matches.length;
    } catch (matchesError: any) {
      debugSteps.steps[4].status = 'error';
      debugSteps.steps[4].error = matchesError.message;
    }

    // Step 7: Check if user is player (if session exists)
    if (session?.user?.id) {
      debugSteps.steps.push({ step: 7, name: 'Fetch Player', status: 'starting' });
      try {
        const [player] = await db
          .select()
          .from(players)
          .where(eq(players.id, session.user.id))
          .limit(1);
        
        debugSteps.steps[5].status = player ? 'success' : 'not_found';
        if (player) {
          debugSteps.steps[5].player = {
            id: player.id,
            fullName: player.fullName,
            clubId: player.clubId,
          };
        }
      } catch (playerError: any) {
        debugSteps.steps[5].status = 'error';
        debugSteps.steps[5].error = playerError.message;
      }
    }

    debugSteps.success = true;
    return NextResponse.json(debugSteps);

  } catch (error: any) {
    debugSteps.success = false;
    debugSteps.fatalError = {
      message: error.message,
      stack: error.stack,
    };
    return NextResponse.json(debugSteps, { status: 500 });
  }
}
