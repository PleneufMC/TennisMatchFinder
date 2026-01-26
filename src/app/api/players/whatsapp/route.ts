/**
 * API Route: WhatsApp Preferences
 * 
 * GET - Récupère les préférences WhatsApp du joueur
 * POST - Met à jour le numéro WhatsApp et active les notifications
 * DELETE - Désactive les notifications WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { formatPhoneNumber, sendTextMessage, isWhatsAppConfigured } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// Validation du numéro de téléphone
const phoneSchema = z.object({
  whatsappNumber: z
    .string()
    .min(10, 'Numéro trop court')
    .max(20, 'Numéro trop long')
    .regex(/^[\d\s+\-()]+$/, 'Format de numéro invalide'),
});

/**
 * GET - Récupère les préférences WhatsApp du joueur
 */
export async function GET() {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer les infos WhatsApp du joueur
    const [playerData] = await db
      .select({
        whatsappNumber: players.whatsappNumber,
        whatsappOptIn: players.whatsappOptIn,
        whatsappVerified: players.whatsappVerified,
      })
      .from(players)
      .where(eq(players.id, player.id))
      .limit(1);

    if (!playerData) {
      return NextResponse.json({ error: 'Joueur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      whatsappNumber: playerData.whatsappNumber,
      whatsappOptIn: playerData.whatsappOptIn,
      whatsappVerified: playerData.whatsappVerified,
      isConfigured: isWhatsAppConfigured(),
    });
  } catch (error) {
    console.error('Error fetching WhatsApp preferences:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des préférences' },
      { status: 500 }
    );
  }
}

/**
 * POST - Active les notifications WhatsApp avec un numéro
 */
export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validation
    const validation = phoneSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Numéro invalide' },
        { status: 400 }
      );
    }

    const { whatsappNumber } = validation.data;
    const formattedNumber = formatPhoneNumber(whatsappNumber);

    // Vérifier que le service WhatsApp est configuré
    if (!isWhatsAppConfigured()) {
      return NextResponse.json(
        { error: 'Le service WhatsApp n\'est pas configuré' },
        { status: 503 }
      );
    }

    // Envoyer un message de confirmation
    const testResult = await sendTextMessage(
      formattedNumber,
      `🎾 TennisMatchFinder\n\n` +
      `Salut ${player.fullName} !\n\n` +
      `Ton numéro WhatsApp a été activé avec succès ! ✅\n\n` +
      `Tu recevras maintenant les notifications importantes :\n` +
      `• Démarrage de Box League\n` +
      `• Rappels de matchs\n` +
      `• Propositions de matchs\n` +
      `• Badges débloqués\n\n` +
      `Pour désactiver, va dans Paramètres > Notifications.\n\n` +
      `Bon tennis ! 🎾`
    );

    if (!testResult.success) {
      console.error('WhatsApp verification failed:', testResult.error);
      return NextResponse.json(
        { 
          error: 'Impossible d\'envoyer le message de vérification. Vérifie ton numéro.',
          details: testResult.error,
        },
        { status: 400 }
      );
    }

    // Mettre à jour les préférences du joueur
    await db
      .update(players)
      .set({
        whatsappNumber: formattedNumber,
        whatsappOptIn: true,
        whatsappVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(players.id, player.id));

    return NextResponse.json({
      success: true,
      message: 'WhatsApp activé ! Tu as reçu un message de confirmation.',
      whatsappNumber: formattedNumber,
      whatsappOptIn: true,
      whatsappVerified: true,
    });
  } catch (error) {
    console.error('Error updating WhatsApp preferences:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'activation de WhatsApp' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Désactive les notifications WhatsApp
 */
export async function DELETE() {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Désactiver WhatsApp mais garder le numéro
    await db
      .update(players)
      .set({
        whatsappOptIn: false,
        updatedAt: new Date(),
      })
      .where(eq(players.id, player.id));

    return NextResponse.json({
      success: true,
      message: 'Notifications WhatsApp désactivées',
      whatsappOptIn: false,
    });
  } catch (error) {
    console.error('Error disabling WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la désactivation' },
      { status: 500 }
    );
  }
}
