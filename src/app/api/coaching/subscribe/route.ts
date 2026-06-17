/**
 * API: Abonnement Coach (Stripe Checkout, 15 €/mois)
 * POST - Crée une session Checkout pour devenir coach.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCoachCheckoutSession } from '@/lib/coaching';
import { withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'stripe');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Vous devez être connecté' }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';

    const checkoutSession = await createCoachCheckoutSession({
      playerId: session.user.id,
      email: session.user.email,
      name: session.user.name ?? undefined,
      successUrl: `${baseUrl}/coaching?subscribed=true`,
      cancelUrl: `${baseUrl}/coaching?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating coach checkout session:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement coach' },
      { status: 500 }
    );
  }
}
