/**
 * API Routes pour les Tournois
 * GET  /api/tournaments - Liste des tournois
 * POST /api/tournaments - Créer un tournoi (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, tournamentParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  createTournament,
  getTournamentsByClub,
} from '@/lib/tournaments';
import type { TournamentStatus } from '@/lib/tournaments';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le joueur et son club
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as TournamentStatus | null;
    const my = searchParams.get('my') === 'true';

    // Récupérer les tournois du club
    const tournaments = await getTournamentsByClub(
      player.clubId,
      status ? { status } : undefined
    );

    // Si "my" est true, filtrer les tournois où le joueur est inscrit
    if (my) {
      const myParticipations = await db
        .select({ tournamentId: tournamentParticipants.tournamentId })
        .from(tournamentParticipants)
        .where(and(
          eq(tournamentParticipants.playerId, player.id),
          eq(tournamentParticipants.isActive, true)
        ));

      const myTournamentIds = new Set(myParticipations.map(p => p.tournamentId));
      const myTournaments = tournaments.filter(t => myTournamentIds.has(t.id));

      return NextResponse.json({ tournaments: myTournaments });
    }

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('Erreur GET /api/tournaments:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    if (!player.isAdmin) {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des tournois' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation des champs requis
    if (!body.name || !body.registrationStart || !body.registrationEnd || !body.startDate) {
      return NextResponse.json(
        { error: 'Champs requis manquants: name, registrationStart, registrationEnd, startDate' },
        { status: 400 }
      );
    }

    // Valider maxParticipants (doit être une puissance de 2)
    const maxParticipants = body.maxParticipants || 16;
    const validSizes = [4, 8, 16, 32, 64];
    if (!validSizes.includes(maxParticipants)) {
      return NextResponse.json(
        { error: 'maxParticipants doit être 4, 8, 16, 32 ou 64' },
        { status: 400 }
      );
    }

    const tournament = await createTournament({
      clubId: player.clubId,
      name: body.name,
      description: body.description,
      format: body.format,
      maxParticipants,
      minParticipants: body.minParticipants,
      eloRangeMin: body.eloRangeMin,
      eloRangeMax: body.eloRangeMax,
      seedingMethod: body.seedingMethod,
      registrationStart: new Date(body.registrationStart),
      registrationEnd: new Date(body.registrationEnd),
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      setsToWin: body.setsToWin,
      finalSetsToWin: body.finalSetsToWin,
      thirdPlaceMatch: body.thirdPlaceMatch,
      entryFee: body.entryFee || 0, // En centimes
      currency: body.currency || 'EUR',
      createdBy: player.id,
    });

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tournaments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
