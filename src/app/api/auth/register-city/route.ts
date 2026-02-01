/**
 * API Route: Inscription avec ville (sans club obligatoire)
 * POST /api/auth/register-city
 * 
 * Crée un joueur avec sa ville, optionnellement avec une demande d'adhésion à un club.
 * Si aucun club n'est choisi, le joueur est assigné à l'Open Club par défaut.
 * Gère également le parrainage (referral) si un referrerId est fourni.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, players, clubs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createJoinRequest, hasUserPendingRequest } from '@/lib/db/queries';
import { SPECIAL_CLUBS } from '@/lib/constants/admins';
import { withRateLimit } from '@/lib/rate-limit';
import { completeReferral } from '@/lib/referrals/service';

// Slug du club par défaut pour les joueurs indépendants
const OPEN_CLUB_SLUG = SPECIAL_CLUBS.OPEN_CLUB_SLUG;

export async function POST(request: NextRequest) {
  // Rate limiting - 3 inscriptions par 5 minutes
  const rateLimitResponse = await withRateLimit(request, 'register');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { email, fullName, city, selfAssessedLevel, clubSlug, referrerId } = body;

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

    // Gérer l'affiliation au club
    let clubId: string | null = null;
    let joinRequestCreated = false;
    let assignedToOpenClub = false;

    // Si un club spécifique est demandé (autre que open-club), créer une demande d'adhésion
    if (clubSlug && clubSlug !== OPEN_CLUB_SLUG) {
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
        // Le joueur sera assigné au club après validation de sa demande
        // En attendant, on l'assigne à l'Open Club
      }
    }

    // BUG-003 FIX: L'Open Club DOIT exister pour que l'inscription fonctionne
    // Si l'Open Club est manquant, l'inscription échoue explicitement au lieu de créer
    // un joueur sans club qui ne pourrait pas accéder au dashboard
    const [openClub] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.slug, OPEN_CLUB_SLUG))
      .limit(1);

    if (!openClub) {
      console.error('[Register] CRITICAL: Open Club not found in database! slug:', OPEN_CLUB_SLUG);
      return NextResponse.json(
        { error: 'Configuration système incorrecte. Veuillez contacter le support.' },
        { status: 500 }
      );
    }

    clubId = openClub.id;
    assignedToOpenClub = true;
    console.log('[Register] Assigning player to Open Club:', openClub.id);

    // Créer le profil joueur (assigné à l'Open Club par défaut)
    const [newPlayer] = await db
      .insert(players)
      .values({
        id: userId,
        clubId, // Open Club par défaut
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

    // Gérer le parrainage si un referrerId est fourni
    let referralCompleted = false;
    if (referrerId) {
      try {
        // Vérifier que le parrain existe et n'est pas le même que le nouveau joueur
        const [referrer] = await db
          .select()
          .from(players)
          .where(eq(players.id, referrerId))
          .limit(1);

        if (referrer && referrer.id !== newPlayer.id) {
          await completeReferral(referrerId, newPlayer.id, email.toLowerCase());
          referralCompleted = true;
          console.log(`[Register] Referral completed: ${referrer.fullName} -> ${fullName}`);
        }
      } catch (referralError) {
        // Ne pas bloquer l'inscription si le parrainage échoue
        console.error('[Register] Referral error (non-blocking):', referralError);
      }
    }

    // Construire le message de retour
    let message = 'Compte créé ! Vous pouvez maintenant vous connecter.';
    if (joinRequestCreated) {
      message = 'Compte créé ! Votre demande d\'adhésion a été envoyée. En attendant, vous avez accès à l\'Open Club.';
    } else if (assignedToOpenClub) {
      message = 'Compte créé ! Vous faites partie de l\'Open Club. Vous pouvez maintenant vous connecter.';
    }

    return NextResponse.json({
      success: true,
      message,
      playerId: newPlayer.id,
      joinRequestCreated,
      assignedToOpenClub,
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
