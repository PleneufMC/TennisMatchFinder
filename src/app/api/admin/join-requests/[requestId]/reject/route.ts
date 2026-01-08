import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { rejectJoinRequest } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { users, clubs, clubJoinRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendJoinRequestRejectedEmail } from '@/lib/email/send-email';

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
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || undefined;

    // Récupérer les infos de la demande avant le rejet
    const [joinRequest] = await db
      .select({
        userId: clubJoinRequests.userId,
        clubId: clubJoinRequests.clubId,
        fullName: clubJoinRequests.fullName,
      })
      .from(clubJoinRequests)
      .where(eq(clubJoinRequests.id, requestId))
      .limit(1);

    const result = await rejectJoinRequest(requestId, player.id, reason);

    // Envoyer un email d'information au demandeur
    if (joinRequest) {
      const [userInfo] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, joinRequest.userId))
        .limit(1);
      
      const [clubInfo] = await db
        .select({ name: clubs.name })
        .from(clubs)
        .where(eq(clubs.id, joinRequest.clubId))
        .limit(1);

      if (userInfo?.email && clubInfo?.name) {
        await sendJoinRequestRejectedEmail({
          to: userInfo.email,
          memberName: joinRequest.fullName,
          clubName: clubInfo.name,
          reason,
        }).catch((err) => {
          console.error('Failed to send rejection email:', err);
          // Ne pas bloquer le rejet si l'email échoue
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demande refusée',
    });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du refus' },
      { status: 500 }
    );
  }
}
