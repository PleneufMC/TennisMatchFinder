import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { approveJoinRequest } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { users, clubs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendWelcomeMemberEmail } from '@/lib/email/send-email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const player = await getServerPlayer();

    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { requestId } = await params;

    const result = await approveJoinRequest(requestId, player.id);

    // Récupérer l'email de l'utilisateur et le nom du club
    const [userInfo] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, result.player.id))
      .limit(1);
    
    const [clubInfo] = await db
      .select({ name: clubs.name })
      .from(clubs)
      .where(eq(clubs.id, result.player.clubId))
      .limit(1);

    // Envoyer un email de bienvenue au nouveau membre
    if (userInfo?.email && clubInfo?.name) {
      await sendWelcomeMemberEmail({
        to: userInfo.email,
        memberName: result.player.fullName,
        clubName: clubInfo.name,
      }).catch((err) => {
        console.error('Failed to send welcome email:', err);
        // Ne pas bloquer l'approbation si l'email échoue
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Demande approuvée avec succès',
      player: {
        id: result.player.id,
        fullName: result.player.fullName,
      },
    });
  } catch (error) {
    console.error('Error approving join request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'approbation' },
      { status: 500 }
    );
  }
}
