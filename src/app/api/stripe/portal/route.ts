import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPortalSession } from '@/lib/stripe/subscription';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Vous devez être connecté' },
        { status: 401 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.com';
    
    const portalSession = await createPortalSession(
      session.user.id,
      `${baseUrl}/pricing`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    
    // If no subscription, return helpful error
    if (error instanceof Error && error.message.includes('No active subscription')) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du portail client' },
      { status: 500 }
    );
  }
}
