/**
 * API Routes pour un Tournoi spécifique
 * GET   /api/tournaments/[tournamentId] - Détails du tournoi + bracket
 * PATCH /api/tournaments/[tournamentId] - Mettre à jour le statut (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, tournamentParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  getTournamentById,
  getTournamentBracket,
  getParticipants,
  updateTournamentStatus,
  generateBracket,
} from '@/lib/tournaments';
import type { TournamentStatus } from '@/lib/tournaments';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { tournamentId } = await params;

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi non trouvé' }, { status: 404 });
    }

    // Récupérer le bracket complet
    const bracket = await getTournamentBracket(tournamentId);
    
    // Récupérer les participants
    const participants = await getParticipants(tournamentId);

    // Vérifier si le joueur actuel est inscrit
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    let isRegistered = false;
    let myParticipation = null;

    if (player) {
      const [participation] = await db
        .select()
        .from(tournamentParticipants)
        .where(and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.playerId, player.id),
          eq(tournamentParticipants.isActive, true)
        ))
        .limit(1);

      if (participation) {
        isRegistered = true;
        myParticipation = participation;
      }
    }

    return NextResponse.json({
      tournament,
      bracket,
      participants,
      isRegistered,
      myParticipation,
    });
  } catch (error) {
    console.error('Erreur GET /api/tournaments/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    if (!player?.isAdmin) {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier les tournois' },
        { status: 403 }
      );
    }

    const { tournamentId } = await params;
    const body = await request.json();

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

    // Action: changer le statut
    if (body.status) {
      const newStatus = body.status as TournamentStatus;
      const validTransitions: Record<TournamentStatus, TournamentStatus[]> = {
        draft: ['registration', 'cancelled'],
        registration: ['seeding', 'cancelled'],
        seeding: ['active', 'cancelled'],
        active: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };

      if (!validTransitions[tournament.status]?.includes(newStatus)) {
        return NextResponse.json(
          { error: `Transition de statut invalide: ${tournament.status} -> ${newStatus}` },
          { status: 400 }
        );
      }

      // Si on passe en "active", générer le bracket
      if (newStatus === 'active' && tournament.status === 'seeding') {
        await generateBracket(tournamentId);
      } else if (newStatus === 'seeding') {
        // Vérifier qu'il y a assez de participants
        const participants = await getParticipants(tournamentId);
        if (participants.length < tournament.minParticipants) {
          return NextResponse.json(
            { error: `Minimum ${tournament.minParticipants} participants requis (${participants.length} inscrits)` },
            { status: 400 }
          );
        }

        // Générer directement le bracket si on passe en seeding
        await generateBracket(tournamentId);
      } else {
        await updateTournamentStatus(tournamentId, newStatus);
      }

      const updated = await getTournamentById(tournamentId);
      return NextResponse.json({ tournament: updated });
    }

    return NextResponse.json(
      { error: 'Aucune action spécifiée' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur PATCH /api/tournaments/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
