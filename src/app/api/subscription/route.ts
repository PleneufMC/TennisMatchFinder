import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSubscription, getUserTier } from '@/lib/stripe/subscription';
import { STRIPE_PLANS } from '@/lib/stripe/config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user.id);
    const tier = await getUserTier(session.user.id);
    // Pro is an alias for Premium (no separate Pro plan for now)
    const plan = (tier === 'pro' || tier === 'premium')
      ? STRIPE_PLANS.PREMIUM 
      : STRIPE_PLANS.FREE;

    return NextResponse.json({
      subscription: subscription ? {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      } : null,
      tier,
      plan: {
        id: plan.id,
        name: plan.name,
        features: plan.features,
        limits: plan.limits,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'abonnement' },
      { status: 500 }
    );
  }
}
