/**
 * API Route: Account Deletion (RGPD)
 * 
 * POST - Demande de suppression de compte (délai 7 jours)
 * GET - Vérifie le statut d'une demande en cours
 * DELETE - Annule une demande de suppression
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  createDeletionRequest,
  cancelDeletionRequest,
  getPendingDeletionRequest,
} from '@/lib/account/deletion-service';
import { sendDeletionRequestEmail, sendDeletionCancelledEmail } from '@/lib/email/send-email';

export const dynamic = 'force-dynamic';

const deleteRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
  reasonCategory: z.enum(['not_using', 'privacy', 'found_alternative', 'too_complex', 'other']).optional(),
  confirmEmail: z.string().email(),
});

/**
 * POST - Crée une demande de suppression de compte
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validation = deleteRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { reason, reasonCategory, confirmEmail } = validation.data;

    // Vérifier que l'email correspond
    if (confirmEmail.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'L\'email de confirmation ne correspond pas à votre compte' },
        { status: 400 }
      );
    }

    // Récupérer IP et User-Agent pour l'audit
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Créer la demande de suppression
    const result = await createDeletionRequest(
      session.user.id,
      reason,
      reasonCategory,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      // Si une demande existe déjà, retourner ses infos
      if (result.requestId) {
        return NextResponse.json({
          success: false,
          error: result.error,
          existingRequest: {
            requestId: result.requestId,
            scheduledDeletionAt: result.scheduledDeletionAt,
          },
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Envoyer l'email de confirmation
    try {
      await sendDeletionRequestEmail(
        session.user.email,
        session.user.name || 'Utilisateur',
        result.scheduledDeletionAt!,
        result.cancellationToken!,
        result.confirmationToken!
      );
    } catch (emailError) {
      console.error('Error sending deletion email:', emailError);
      // Continue même si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Demande de suppression enregistrée',
      requestId: result.requestId,
      scheduledDeletionAt: result.scheduledDeletionAt,
      gracePeriodDays: 7,
    });
  } catch (error) {
    console.error('Error creating deletion request:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la demande' },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupère le statut de la demande de suppression en cours
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const pendingRequest = await getPendingDeletionRequest(session.user.id);

    if (!pendingRequest) {
      return NextResponse.json({
        hasPendingRequest: false,
      });
    }

    // Calculer les jours restants
    const now = new Date();
    const scheduledDate = new Date(pendingRequest.scheduledDeletionAt);
    const daysRemaining = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      hasPendingRequest: true,
      request: {
        id: pendingRequest.id,
        status: pendingRequest.status,
        requestedAt: pendingRequest.requestedAt,
        scheduledDeletionAt: pendingRequest.scheduledDeletionAt,
        daysRemaining: Math.max(0, daysRemaining),
      },
    });
  } catch (error) {
    console.error('Error fetching deletion status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Annule une demande de suppression en cours
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const result = await cancelDeletionRequest(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Envoyer l'email de confirmation d'annulation
    try {
      await sendDeletionCancelledEmail(
        session.user.email,
        session.user.name || 'Utilisateur'
      );
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Demande de suppression annulée',
    });
  } catch (error) {
    console.error('Error cancelling deletion request:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation' },
      { status: 500 }
    );
  }
}
