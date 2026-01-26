/**
 * API Route: Super Admin WhatsApp Broadcast
 * 
 * GET - Récupère les stats WhatsApp globales (tous les clubs)
 * POST - Envoie un message WhatsApp à tous les utilisateurs de la plateforme
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { players, clubs } from '@/lib/db/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { sendTextMessage, isWhatsAppConfigured } from '@/lib/whatsapp';
import { isSuperAdminEmail } from '@/lib/constants/admins';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const broadcastSchema = z.object({
  message: z.string().min(1, 'Message requis').max(1000, 'Message trop long'),
  clubId: z.string().uuid().optional(), // Si spécifié, envoie uniquement à ce club
});

/**
 * Vérifie si l'utilisateur est super admin
 */
async function checkSuperAdmin(): Promise<{ isSuperAdmin: boolean; email?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { isSuperAdmin: false };
  }
  return {
    isSuperAdmin: isSuperAdminEmail(session.user.email),
    email: session.user.email,
  };
}

/**
 * GET - Récupère les stats WhatsApp globales
 */
export async function GET() {
  try {
    const { isSuperAdmin } = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Accès super admin requis' }, { status: 403 });
    }

    // Stats globales
    const globalStats = await db
      .select({
        totalOptIn: sql<number>`count(*)::int`,
      })
      .from(players)
      .where(
        and(
          eq(players.whatsappOptIn, true),
          isNotNull(players.whatsappNumber)
        )
      );

    // Stats par club
    const clubStats = await db
      .select({
        clubId: players.clubId,
        clubName: clubs.name,
        count: sql<number>`count(*)::int`,
      })
      .from(players)
      .leftJoin(clubs, eq(players.clubId, clubs.id))
      .where(
        and(
          eq(players.whatsappOptIn, true),
          isNotNull(players.whatsappNumber)
        )
      )
      .groupBy(players.clubId, clubs.name);

    return NextResponse.json({
      isConfigured: isWhatsAppConfigured(),
      stats: {
        totalOptIn: globalStats[0]?.totalOptIn || 0,
        byClub: clubStats.map(c => ({
          clubId: c.clubId,
          clubName: c.clubName || 'Sans club',
          count: c.count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching global WhatsApp stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des stats' },
      { status: 500 }
    );
  }
}

/**
 * POST - Envoie un message WhatsApp à tous les utilisateurs (ou un club spécifique)
 */
export async function POST(request: NextRequest) {
  try {
    const { isSuperAdmin, email } = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Accès super admin requis' }, { status: 403 });
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

    const { message, clubId } = validation.data;

    // Construire la clause where
    let whereClause = and(
      eq(players.whatsappOptIn, true),
      isNotNull(players.whatsappNumber)
    );

    if (clubId) {
      whereClause = and(whereClause, eq(players.clubId, clubId));
    }

    // Récupérer tous les destinataires
    const recipients = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        whatsappNumber: players.whatsappNumber,
        clubId: players.clubId,
      })
      .from(players)
      .where(whereClause);

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        stats: { sent: 0, failed: 0, total: 0 },
        message: 'Aucun utilisateur avec WhatsApp activé',
      });
    }

    console.log(`Super Admin ${email} broadcasting WhatsApp to ${recipients.length} users`);

    // Envoyer les messages (avec un délai pour éviter le rate limiting)
    const results: Array<{ success: boolean; playerId: string; error?: string }> = [];
    
    for (const recipient of recipients) {
      if (!recipient.whatsappNumber) {
        results.push({ success: false, playerId: recipient.id, error: 'No number' });
        continue;
      }

      try {
        const result = await sendTextMessage(recipient.whatsappNumber, message);
        results.push({
          success: result.success,
          playerId: recipient.id,
          error: result.success ? undefined : result.error,
        });

        // Petit délai entre les messages pour éviter le rate limiting (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          success: false,
          playerId: recipient.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Super Admin WhatsApp broadcast completed: ${sent} sent, ${failed} failed`);

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
