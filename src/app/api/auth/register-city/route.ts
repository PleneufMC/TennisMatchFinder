/**
 * API Route: Inscription avec ville (sans club obligatoire)
 * POST /api/auth/register-city
 * 
 * Crée un joueur avec sa ville, optionnellement avec une demande d'adhésion à un club
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, players, clubs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createJoinRequest, hasUserPendingRequest } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, city, selfAssessedLevel, clubSlug } = body;

    // Validation basique
    if (!email || !fullName || !city) {
      return NextResponse.json(
        { error: 'Email, nom complet et ville sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    let userId: string;

    if (existingUser) {
      // Vérifier s'il a déjà un profil joueur
      const [existingPlayer] = await db
        .select()
        .from(players)
        .where(eq(players.id, existingUser.id))
        .limit(1);

      if (existingPlayer) {
        return NextResponse.json(
          { error: 'Vous avez déjà un profil joueur. Connectez-vous à la place.' },
          { status: 400 }
        );
      }

      userId = existingUser.id;
    } else {
      // Créer l'utilisateur
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          name: fullName,
        })
        .returning();

      if (!newUser) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du compte' },
          { status: 500 }
        );
      }

      userId = newUser.id;
    }

    // Créer le joueur SANS club (ou avec demande de club)
    let clubId: string | null = null;
    let joinRequestCreated = false;

    // Si un club est spécifié, créer une demande d'adhésion
    if (clubSlug) {
      const [club] = await db
        .select()
        .from(clubs)
        .where(and(eq(clubs.slug, clubSlug), eq(clubs.isActive, true)))
        .limit(1);

      if (club) {
        // Vérifier s'il n'y a pas déjà une demande en attente
        const hasPending = await hasUserPendingRequest(userId, club.id);
        if (!hasPending) {
          await createJoinRequest({
            clubId: club.id,
            userId,
            fullName,
            email: email.toLowerCase(),
            selfAssessedLevel: selfAssessedLevel || 'intermédiaire',
          });
          joinRequestCreated = true;
        }
      }
    }

    // Créer le profil joueur (sans club affilié)
    const [newPlayer] = await db
      .insert(players)
      .values({
        id: userId,
        clubId: null, // Pas de club par défaut
        city: city.trim(),
        fullName,
        selfAssessedLevel: selfAssessedLevel || 'intermédiaire',
        currentElo: 1200,
        bestElo: 1200,
        lowestElo: 1200,
      })
      .returning();

    if (!newPlayer) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil joueur' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: joinRequestCreated 
        ? 'Compte créé ! Votre demande d\'adhésion a été envoyée.'
        : 'Compte créé ! Vous pouvez maintenant vous connecter.',
      playerId: newPlayer.id,
      joinRequestCreated,
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Gérer l'erreur de contrainte unique
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Ce compte existe déjà.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
