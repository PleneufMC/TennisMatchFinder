import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, clubs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createJoinRequest, hasUserPendingRequest, getPlayerById } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, clubSlug, selfAssessedLevel, phone, message } = body;

    // Validation basique
    if (!email || !fullName || !clubSlug) {
      return NextResponse.json(
        { error: 'Email, nom complet et club sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que le club existe
    const [club] = await db
      .select()
      .from(clubs)
      .where(and(eq(clubs.slug, clubSlug), eq(clubs.isActive, true)))
      .limit(1);

    if (!club) {
      return NextResponse.json(
        { error: 'Club non trouvé ou inactif' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Si l'utilisateur existe, vérifier s'il a déjà un profil joueur
    if (existingUser) {
      const existingPlayer = await getPlayerById(existingUser.id);
      if (existingPlayer) {
        return NextResponse.json(
          { error: 'Vous avez déjà un profil joueur. Connectez-vous à la place.' },
          { status: 400 }
        );
      }

      // Vérifier s'il a déjà une demande en attente
      const hasPending = await hasUserPendingRequest(existingUser.id, club.id);
      if (hasPending) {
        return NextResponse.json(
          { error: 'Vous avez déjà une demande d\'adhésion en attente pour ce club.' },
          { status: 400 }
        );
      }
    } else {
      // Créer l'utilisateur
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          name: fullName,
        })
        .returning();
      existingUser = newUser;
    }

    // Créer la demande d'adhésion
    const joinRequest = await createJoinRequest({
      clubId: club.id,
      userId: existingUser.id,
      fullName,
      email: email.toLowerCase(),
      phone,
      message,
      selfAssessedLevel: selfAssessedLevel || 'intermédiaire',
    });

    return NextResponse.json({
      success: true,
      message: 'Demande d\'adhésion envoyée ! Un administrateur va la valider.',
      requestId: joinRequest.id,
      requiresApproval: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Gérer l'erreur de contrainte unique
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Vous avez déjà une demande en attente pour ce club.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
