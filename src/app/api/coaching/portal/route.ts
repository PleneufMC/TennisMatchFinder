/**
 * API: Portail de gestion de l'abonnement Coach (Stripe Billing Portal)
 * POST - Ouvre le portail Stripe pour gérer/annuler l'abonnement coach.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCoachPortalSession } from '@/lib/coaching';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'stripe');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Vous devez être connecté' }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';
    const portalSession = await createCoachPortalSession(session.user.id, `${baseUrl}/coaching`);

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating coach portal session:', error);
    return NextResponse.json(
      { error: 'Aucun abonnement coach actif trouvé' },
      { status: 400 }
    );
  }
}
