/**
 * API Route: Confirm Account Deletion
 * 
 * POST - Confirme une suppression immédiate via token (depuis l'email)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { confirmDeletionRequest, cancelDeletionRequest } from '@/lib/account/deletion-service';

export const dynamic = 'force-dynamic';

const confirmSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  action: z.enum(['confirm', 'cancel']),
});

/**
 * POST - Confirme ou annule une suppression via token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = confirmSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { token, action } = validation.data;

    if (action === 'confirm') {
      // Confirmer et exécuter la suppression immédiatement
      const result = await confirmDeletionRequest(token);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Votre compte a été supprimé définitivement',
      });
    } else {
      // Annuler la demande
      const result = await cancelDeletionRequest('', token); // userId vide, on utilise le token
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Demande de suppression annulée',
      });
    }
  } catch (error) {
    console.error('Error processing deletion confirmation:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement' },
      { status: 500 }
    );
  }
}
