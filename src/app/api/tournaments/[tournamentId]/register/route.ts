/**
 * API Route pour l'inscription à un tournoi
 * POST /api/tournaments/[tournamentId]/register - S'inscrire au tournoi
 * DELETE /api/tournaments/[tournamentId]/register - Se désinscrire
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, tournamentParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  getTournamentById,
  registerParticipant,
  withdrawParticipant,
} from '@/lib/tournaments';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { tournamentId } = await params;

    // Récupérer le joueur
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    // Récupérer le tournoi
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi non trouvé' }, { status: 404 });
    }

    // Vérifier que le tournoi appartient au même club
    if (tournament.clubId !== player.clubId) {
      return NextResponse.json(
        { error: 'Ce tournoi n\'appartient pas à votre club' },
        { status: 403 }
      );
    }

    // Vérifier que les inscriptions sont ouvertes
    if (tournament.status !== 'registration') {
      return NextResponse.json(
        { error: 'Les inscriptions ne sont pas ouvertes pour ce tournoi' },
        { status: 400 }
      );
    }

    // Vérifier la période d'inscription
    const now = new Date();
    if (now < new Date(tournament.registrationStart)) {
      return NextResponse.json(
        { error: 'Les inscriptions n\'ont pas encore commencé' },
        { status: 400 }
      );
    }

    if (now > new Date(tournament.registrationEnd)) {
      return NextResponse.json(
        { error: 'La période d\'inscription est terminée' },
        { status: 400 }
      );
    }

    // Vérifier les critères ELO
    if (tournament.eloRangeMin && player.currentElo < tournament.eloRangeMin) {
      return NextResponse.json(
        { error: `ELO minimum requis: ${tournament.eloRangeMin}` },
        { status: 400 }
      );
    }

    if (tournament.eloRangeMax && player.currentElo > tournament.eloRangeMax) {
      return NextResponse.json(
        { error: `ELO maximum: ${tournament.eloRangeMax}` },
        { status: 400 }
      );
    }

    // Inscrire le joueur
    const participation = await registerParticipant({
      tournamentId,
      playerId: player.id,
      currentElo: player.currentElo,
    });

    return NextResponse.json({ participation }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tournaments/[id]/register:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { tournamentId } = await params;

    // Récupérer le joueur
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    // Récupérer le tournoi
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi non trouvé' }, { status: 404 });
    }

    // Vérifier que le tournoi est encore en phase d'inscription
    if (tournament.status !== 'registration') {
      return NextResponse.json(
        { error: 'Impossible de se désinscrire après la clôture des inscriptions' },
        { status: 400 }
      );
    }

    // Vérifier que le joueur est inscrit
    const [participation] = await db
      .select()
      .from(tournamentParticipants)
      .where(and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.playerId, player.id),
        eq(tournamentParticipants.isActive, true)
      ))
      .limit(1);

    if (!participation) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas inscrit à ce tournoi' },
        { status: 400 }
      );
    }

    // Désinscrire le joueur
    await withdrawParticipant(tournamentId, player.id, 'Désinscription volontaire');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/tournaments/[id]/register:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
