import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tournaments, tournamentParticipants, players } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

/**
 * POST /api/tournaments/[tournamentId]/checkout
 * Créer une session Stripe Checkout pour l'inscription à un tournoi payant
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { tournamentId } = await params;

    // Récupérer le joueur (players.id = users.id)
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    // Récupérer le tournoi
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi non trouvé' }, { status: 404 });
    }

    // Vérifier que le tournoi est ouvert aux inscriptions
    if (tournament.status !== 'registration') {
      return NextResponse.json(
        { error: 'Les inscriptions ne sont pas ouvertes pour ce tournoi' },
        { status: 400 }
      );
    }

    // Vérifier que le tournoi est payant
    if (tournament.entryFee <= 0) {
      return NextResponse.json(
        { error: 'Ce tournoi est gratuit, utilisez l\'inscription directe' },
        { status: 400 }
      );
    }

    // Vérifier que le joueur n'est pas déjà inscrit
    const [existingParticipant] = await db
      .select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.playerId, player.id)
        )
      )
      .limit(1);

    if (existingParticipant) {
      if (existingParticipant.paymentStatus === 'paid') {
        return NextResponse.json(
          { error: 'Vous êtes déjà inscrit à ce tournoi' },
          { status: 400 }
        );
      }
      // Si paiement en attente, on peut recréer une session
    }

    // Vérifier les critères ELO
    if (tournament.eloRangeMin && player.currentElo < tournament.eloRangeMin) {
      return NextResponse.json(
        { error: `Votre ELO (${player.currentElo}) est inférieur au minimum requis (${tournament.eloRangeMin})` },
        { status: 400 }
      );
    }

    if (tournament.eloRangeMax && player.currentElo > tournament.eloRangeMax) {
      return NextResponse.json(
        { error: `Votre ELO (${player.currentElo}) est supérieur au maximum autorisé (${tournament.eloRangeMax})` },
        { status: 400 }
      );
    }

    // Vérifier le nombre de participants
    const participantsCount = await db
      .select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.paymentStatus, 'paid')
        )
      );

    if (participantsCount.length >= tournament.maxParticipants) {
      return NextResponse.json(
        { error: 'Le tournoi est complet' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Créer ou mettre à jour le participant avec statut pending
    let participantId: string;
    
    if (existingParticipant) {
      participantId = existingParticipant.id;
    } else {
      const [newParticipant] = await db
        .insert(tournamentParticipants)
        .values({
          tournamentId,
          playerId: player.id,
          eloAtRegistration: player.currentElo,
          paymentStatus: 'pending',
        })
        .returning();
      
      if (!newParticipant) {
        return NextResponse.json(
          { error: 'Erreur lors de la création de l\'inscription' },
          { status: 500 }
        );
      }
      participantId = newParticipant.id;
    }

    // Créer la session Stripe Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: tournament.currency.toLowerCase(),
            product_data: {
              name: `Inscription: ${tournament.name}`,
              description: tournament.description || `Tournoi de tennis - ${tournament.format}`,
              metadata: {
                tournamentId: tournament.id,
                tournamentName: tournament.name,
              },
            },
            unit_amount: tournament.entryFee, // Déjà en centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'tournament_registration',
        tournamentId: tournament.id,
        participantId: participantId,
        playerId: player.id,
        playerName: player.fullName,
      },
      customer_email: session.user.email || undefined,
      success_url: `${baseUrl}/tournaments/${tournamentId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/tournaments/${tournamentId}?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    // Mettre à jour le participant avec l'ID de session
    await db
      .update(tournamentParticipants)
      .set({
        stripeSessionId: checkoutSession.id,
      })
      .where(eq(tournamentParticipants.id, participantId));

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Erreur checkout tournoi:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
}
