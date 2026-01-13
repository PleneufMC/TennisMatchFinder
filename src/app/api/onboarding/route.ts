/**
 * API Route: Onboarding - Création du profil joueur
 * POST /api/onboarding
 * 
 * Crée un profil joueur pour un utilisateur déjà connecté (via NextAuth)
 * qui n'a pas encore de profil player
 * 
 * Supporte le nouveau flow en 5 étapes avec:
 * - fullName, city, selfAssessedLevel (requis)
 * - dominantHand, availability, preferences (optionnels)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkAndAwardBadges } from '@/lib/gamification/badge-service';

interface OnboardingPayload {
  fullName: string;
  city: string;
  selfAssessedLevel?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  dominantHand?: 'right' | 'left' | 'ambidextrous';
  avatarUrl?: string;
  availability?: {
    days: string[];
    timeSlots: string[];
  };
  preferences?: {
    gameTypes: string[];
    surfaces: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body: OnboardingPayload = await request.json();
    const { 
      fullName, 
      city, 
      selfAssessedLevel,
      dominantHand,
      avatarUrl,
      availability,
      preferences,
    } = body;

    // Validation basique
    if (!fullName || !city) {
      return NextResponse.json(
        { error: 'Nom complet et ville sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si le joueur existe déjà
    const [existingPlayer] = await db
      .select()
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Vous avez déjà un profil joueur' },
        { status: 400 }
      );
    }

    // Normaliser la ville
    const normalizedCity = city.trim()
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Préparer les données de disponibilité et préférences
    const playerAvailability = availability || { days: [], timeSlots: [] };
    const playerPreferences = preferences || { gameTypes: ['simple'], surfaces: [] };

    // Ajouter la main dominante aux préférences si fournie
    if (dominantHand) {
      (playerPreferences as Record<string, unknown>).dominantHand = dominantHand;
    }

    // Créer le profil joueur
    const [newPlayer] = await db
      .insert(players)
      .values({
        id: session.user.id,
        clubId: null,
        city: normalizedCity,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl || session.user.image || null,
        selfAssessedLevel: selfAssessedLevel || 'intermédiaire',
        availability: playerAvailability,
        preferences: playerPreferences,
        currentElo: 1200,
        bestElo: 1200,
        lowestElo: 1200,
      })
      .returning();

    if (!newPlayer) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil' },
        { status: 500 }
      );
    }

    // Vérifier les badges initiaux (Early Bird si applicable)
    try {
      await checkAndAwardBadges(newPlayer.id);
    } catch (badgeError) {
      // Ne pas bloquer l'onboarding si les badges échouent
      console.warn('Badge check failed during onboarding:', badgeError);
    }

    return NextResponse.json({
      success: true,
      message: 'Profil créé avec succès !',
      playerId: newPlayer.id,
    });
  } catch (error) {
    console.error('Onboarding error:', error);

    // Gérer l'erreur de contrainte unique
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Ce profil existe déjà' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du profil' },
      { status: 500 }
    );
  }
}
