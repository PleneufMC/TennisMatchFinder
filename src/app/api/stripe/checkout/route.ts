import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe/subscription';
import { STRIPE_PLANS } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { priceId, billingPeriod } = body;

    // Validate price ID
    const validPriceIds = [
      STRIPE_PLANS.PREMIUM.stripePriceIdMonthly,
      STRIPE_PLANS.PREMIUM.stripePriceIdYearly,
      STRIPE_PLANS.PRO.stripePriceIdMonthly,
      STRIPE_PLANS.PRO.stripePriceIdYearly,
    ].filter(Boolean);

    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'Prix invalide' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';
    
    const checkoutSession = await createCheckoutSession(
      session.user.id,
      session.user.email,
      priceId,
      `${baseUrl}/settings?subscription=success`,
      `${baseUrl}/pricing?subscription=canceled`
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
