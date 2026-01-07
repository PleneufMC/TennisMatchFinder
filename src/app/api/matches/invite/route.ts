import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, clubJoinRequests } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';

// POST: Inviter un nouveau joueur dans le club
export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name } = body;

    // Validation
    if (!email || !name) {
      return NextResponse.json({ error: 'Email et nom requis' }, { status: 400 });
    }

    // Vérifier si l'email est déjà un utilisateur
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const foundUser = existingUser[0];
    if (foundUser) {
      // L'utilisateur existe déjà, vérifier s'il a une demande en cours
      const existingRequest = await db
        .select()
        .from(clubJoinRequests)
        .where(
          and(
            eq(clubJoinRequests.userId, foundUser.id),
            eq(clubJoinRequests.clubId, player.clubId),
            eq(clubJoinRequests.status, 'pending')
          )
        )
        .limit(1);

      if (existingRequest.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Une invitation est déjà en attente pour cet utilisateur.',
          alreadyInvited: true,
        });
      }

      // Créer une demande d'adhésion pour l'utilisateur existant
      await db.insert(clubJoinRequests).values({
        clubId: player.clubId,
        userId: foundUser.id,
        fullName: name,
        email: email.toLowerCase(),
        message: `Invité par ${player.fullName}`,
        selfAssessedLevel: 'intermédiaire',
        status: 'pending',
      });

      // TODO: Envoyer un email de notification à l'utilisateur

      return NextResponse.json({
        success: true,
        message: `${name} a été invité à rejoindre le club. Un email lui a été envoyé.`,
        existingUser: true,
      });
    }

    // L'utilisateur n'existe pas encore
    // Créer un compte utilisateur "fantôme" en attente de vérification
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: name,
        emailVerified: null, // Non vérifié
      })
      .returning();

    if (!newUser) {
      return NextResponse.json({ error: 'Erreur lors de la création de l\'utilisateur' }, { status: 500 });
    }

    // Créer une demande d'adhésion automatiquement approuvée (invité par un membre)
    await db.insert(clubJoinRequests).values({
      clubId: player.clubId,
      userId: newUser.id,
      fullName: name,
      email: email.toLowerCase(),
      message: `Invité par ${player.fullName}`,
      selfAssessedLevel: 'intermédiaire',
      status: 'pending', // En attente que l'admin approuve
    });

    // TODO: Envoyer un email magic link à l'utilisateur pour qu'il puisse:
    // 1. Vérifier son email
    // 2. Compléter son profil
    // 3. Rejoindre le club

    return NextResponse.json({
      success: true,
      message: `Une invitation a été envoyée à ${name} (${email}). Il pourra rejoindre le club après avoir vérifié son email.`,
      newUser: true,
    });
  } catch (error) {
    console.error('Error inviting player:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
