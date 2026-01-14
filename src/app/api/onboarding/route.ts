/**
 * API Route: Onboarding
 * POST - Sauvegarde les données du profil après l'onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkPassiveBadges } from '@/lib/gamification/badge-checker';

interface OnboardingData {
  fullName: string;
  phone?: string;
  bio?: string;
  selfAssessedLevel: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
  preferredHand?: 'droitier' | 'gaucher' | 'ambidextre';
  availability: {
    days: string[];
    timeSlots: string[];
  };
  preferences: {
    gameTypes: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data: OnboardingData = await request.json();

    // Validation
    if (!data.fullName || data.fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    // Vérifier si le joueur existe
    const [existingPlayer] = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.id, session.user.id))
      .limit(1);

    const now = new Date();

    if (existingPlayer) {
      // Mettre à jour le profil existant
      await db
        .update(players)
        .set({
          fullName: data.fullName.trim(),
          phone: data.phone?.trim() || null,
          bio: data.bio?.trim() || null,
          selfAssessedLevel: data.selfAssessedLevel,
          availability: data.availability,
          preferences: {
            ...data.preferences,
            preferredHand: data.preferredHand,
          },
          onboardingCompleted: true,
          updatedAt: now,
        })
        .where(eq(players.id, session.user.id));
    } else {
      // Créer un nouveau profil
      await db.insert(players).values({
        id: session.user.id,
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || null,
        bio: data.bio?.trim() || null,
        selfAssessedLevel: data.selfAssessedLevel,
        availability: data.availability,
        preferences: {
          ...data.preferences,
          preferredHand: data.preferredHand,
        },
        currentElo: 1200,
        bestElo: 1200,
        lowestElo: 1200,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        bestWinStreak: 0,
        uniqueOpponents: 0,
        isActive: true,
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Vérifier et attribuer les badges passifs (Founding Member, etc.)
    const newBadges = await checkPassiveBadges(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Profil sauvegardé avec succès !',
      newBadges: newBadges.length > 0 ? newBadges : undefined,
    });
  } catch (error) {
    console.error('Error in onboarding:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
