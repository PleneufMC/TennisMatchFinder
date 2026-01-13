/**
 * API Route: POST /api/badges/[badgeId]/seen
 * 
 * Marque un badge comme "vu" (célébration affichée).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markBadgeAsSeen } from '@/lib/gamification/badge-checker';

export async function POST(
  request: NextRequest,
  { params }: { params: { badgeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    const { badgeId } = params;
    
    await markBadgeAsSeen(session.user.id, badgeId);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error marking badge as seen:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
