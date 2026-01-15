import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSubscription, getUserTier } from '@/lib/stripe/subscription';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ tier: 'free', status: 'none' });
    }

    const tier = await getUserTier(session.user.id);
    const subscription = await getUserSubscription(session.user.id);

    return NextResponse.json({
      tier,
      status: subscription?.status || 'none',
      currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
