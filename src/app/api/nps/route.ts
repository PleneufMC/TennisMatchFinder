/**
 * API Routes NPS Survey
 * GET /api/nps - Vérifier l'éligibilité au survey
 * POST /api/nps - Soumettre une réponse
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  checkNpsEligibility, 
  submitNpsSurvey, 
  dismissNpsSurvey 
} from '@/lib/nps/service';

/**
 * GET /api/nps
 * Vérifie si l'utilisateur courant est éligible pour un survey NPS
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ eligible: false }, { status: 200 });
    }

    const eligibility = await checkNpsEligibility(session.user.id);
    
    return NextResponse.json(eligibility);
  } catch (error) {
    console.error('NPS eligibility check error:', error);
    return NextResponse.json({ eligible: false }, { status: 200 });
  }
}

/**
 * POST /api/nps
 * Soumet une réponse NPS ou enregistre un dismiss
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { score, feedback, triggerReason, triggerValue, dismissed } = body;

    // Si l'utilisateur a fermé le survey sans répondre
    if (dismissed) {
      await dismissNpsSurvey({
        playerId: session.user.id,
        triggerReason: triggerReason || 'manual',
        triggerValue,
      });
      return NextResponse.json({ success: true, dismissed: true });
    }

    // Validation du score
    if (score === undefined || score === null) {
      return NextResponse.json(
        { error: 'Score requis' },
        { status: 400 }
      );
    }

    const result = await submitNpsSurvey({
      playerId: session.user.id,
      score: Number(score),
      feedback,
      triggerReason: triggerReason || 'manual',
      triggerValue,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      surveyId: result.surveyId 
    });
  } catch (error) {
    console.error('NPS submission error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
