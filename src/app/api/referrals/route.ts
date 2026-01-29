/**
 * API Route: Referrals (Parrainage)
 * 
 * GET /api/referrals - Récupère les stats et filleuls du joueur connecté
 * POST /api/referrals - Enregistre un nouveau parrainage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getReferralStats, 
  getReferredPlayers,
  generateReferralLink,
} from '@/lib/referrals/service';

/**
 * GET /api/referrals
 * Récupère les statistiques et la liste des filleuls
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const playerId = session.user.player?.id;
    
    if (!playerId) {
      return NextResponse.json(
        { error: 'Profil joueur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les stats
    const stats = await getReferralStats(playerId);
    
    // Récupérer les filleuls
    const referredPlayers = await getReferredPlayers(playerId);
    
    // Générer le lien de parrainage
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';
    const referralLink = generateReferralLink(playerId, baseUrl);

    return NextResponse.json({
      success: true,
      stats,
      referredPlayers,
      referralLink: referralLink.url,
    });
  } catch (error) {
    console.error('[API/referrals] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}
