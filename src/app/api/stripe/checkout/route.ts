import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe/subscription';
import { STRIPE_PLANS } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, billingPeriod = 'yearly', priceId: directPriceId } = body;

    let finalPriceId: string | undefined;

    // Support both direct priceId and planId + billingPeriod
    if (directPriceId) {
      // Direct price ID from pricing page
      finalPriceId = directPriceId;
    } else if (planId && ['premium', 'pro'].includes(planId)) {
      // Plan ID with billing period
      const plan = planId === 'premium' ? STRIPE_PLANS.PREMIUM : STRIPE_PLANS.PRO;
      finalPriceId = billingPeriod === 'yearly' 
        ? plan.stripePriceIdYearly 
        : plan.stripePriceIdMonthly;
    }

    if (!finalPriceId) {
      return NextResponse.json(
        { error: 'Prix non configuré pour ce plan' },
        { status: 400 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.com';
    const checkoutSession = await createCheckoutSession(
      session.user.id,
      session.user.email,
      finalPriceId,
      `${baseUrl}/pricing?success=true`,
      `${baseUrl}/pricing?canceled=true`
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
