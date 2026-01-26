/**
 * API Route: Admin WhatsApp Broadcast
 * 
 * GET - Récupère les stats WhatsApp du club (nombre d'opt-in)
 * POST - Envoie un message WhatsApp à tous les membres du club qui ont opté
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { sendTextMessage, isWhatsAppConfigured } from '@/lib/whatsapp';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const broadcastSchema = z.object({
  message: z.string().min(1, 'Message requis').max(1000, 'Message trop long'),
  targetActive: z.boolean().optional().default(false),
});

/**
 * GET - Récupère les stats WhatsApp du club
 */
export async function GET() {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin || !player.clubId) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    // Compter les membres avec WhatsApp activé
    const whatsappMembers = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        whatsappNumber: players.whatsappNumber,
        isActive: players.isActive,
      })
      .from(players)
      .where(
        and(
          eq(players.clubId, player.clubId),
          eq(players.whatsappOptIn, true),
          isNotNull(players.whatsappNumber)
        )
      );

    const activeMembers = whatsappMembers.filter(m => m.isActive);

    return NextResponse.json({
      isConfigured: isWhatsAppConfigured(),
      stats: {
        totalOptIn: whatsappMembers.length,
        activeOptIn: activeMembers.length,
      },
    });
  } catch (error) {
    console.error('Error fetching WhatsApp stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des stats' },
      { status: 500 }
    );
  }
}

/**
 * POST - Envoie un message WhatsApp à tous les membres du club
 */
export async function POST(request: NextRequest) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin || !player.clubId) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    if (!isWhatsAppConfigured()) {
      return NextResponse.json(
        { error: 'WhatsApp n\'est pas configuré' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = broadcastSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { message, targetActive } = validation.data;

    // Récupérer les membres avec WhatsApp activé
    let whereClause = and(
      eq(players.clubId, player.clubId),
      eq(players.whatsappOptIn, true),
      isNotNull(players.whatsappNumber)
    );

    if (targetActive) {
      whereClause = and(whereClause, eq(players.isActive, true));
    }

    const recipients = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        whatsappNumber: players.whatsappNumber,
      })
      .from(players)
      .where(whereClause);

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        stats: { sent: 0, failed: 0, total: 0 },
        message: 'Aucun membre avec WhatsApp activé',
      });
    }

    // Envoyer les messages
    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        if (!recipient.whatsappNumber) return { success: false, error: 'No number' };
        
        const result = await sendTextMessage(
          recipient.whatsappNumber,
          message
        );
        
        return {
          playerId: recipient.id,
          playerName: recipient.fullName,
          ...result,
        };
      })
    );

    const sent = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;
    
    const failed = results.filter(
      r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    ).length;

    console.log(`WhatsApp broadcast to club ${player.clubId}: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      stats: {
        sent,
        failed,
        total: recipients.length,
      },
    });
  } catch (error) {
    console.error('Error broadcasting WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi' },
      { status: 500 }
    );
  }
}
