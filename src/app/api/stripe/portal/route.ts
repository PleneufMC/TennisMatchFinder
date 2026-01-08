import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPortalSession } from '@/lib/stripe/subscription';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';
    
    const portalSession = await createPortalSession(
      session.user.id,
      `${baseUrl}/settings`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    
    // If no subscription found, return specific error
    if (error instanceof Error && error.message === 'No active subscription found') {
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du portail de gestion' },
      { status: 500 }
    );
  }
}
