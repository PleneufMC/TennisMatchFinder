/**
 * API Route: Club Stats for Admin Dashboard
 * GET /api/clubs/[clubId]/stats
 * 
 * Retourne toutes les statistiques pour le dashboard admin club.
 * Accès réservé aux admins du club.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { getClubStats, type ClubStatsResponse } from '@/lib/club/stats-service';
import { isSuperAdminEmail } from '@/lib/constants/admins';
import { getSession } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const player = await getServerPlayer();
    const session = await getSession();
    
    if (!player) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // BUG-007 FIX: Next.js 15 requires awaiting params
    const { clubId } = await params;

    // Vérifier que le joueur est admin de ce club OU super admin
    const isSuperAdmin = session?.user?.email && isSuperAdminEmail(session.user.email);
    const isClubAdmin = player.clubId === clubId && player.isAdmin;
    
    if (!isClubAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé. Vous devez être administrateur de ce club.' },
        { status: 403 }
      );
    }

    const stats = await getClubStats(clubId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[ClubStats] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des statistiques' },
      { status: 500 }
    );
  }
}
