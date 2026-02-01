/**
 * API Route: Export Club Members as CSV
 * GET /api/clubs/[clubId]/members/export
 * 
 * Exporte la liste des membres du club au format CSV.
 * Accès réservé aux admins du club.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer, getSession } from '@/lib/auth-helpers';
import { getClubMembersForExport } from '@/lib/club/stats-service';
import { isSuperAdminEmail } from '@/lib/constants/admins';
import { db } from '@/lib/db';
import { clubs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    // Récupérer le nom du club pour le nom du fichier
    const [club] = await db
      .select({ name: clubs.name, slug: clubs.slug })
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);

    if (!club) {
      return NextResponse.json(
        { error: 'Club non trouvé' },
        { status: 404 }
      );
    }

    // Générer le CSV
    const csv = await getClubMembersForExport(clubId);
    
    // Créer le nom du fichier avec la date
    const date = new Date().toISOString().split('T')[0];
    const filename = `membres-${club.slug}-${date}.csv`;

    // Retourner le fichier CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[MembersExport] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des membres' },
      { status: 500 }
    );
  }
}
