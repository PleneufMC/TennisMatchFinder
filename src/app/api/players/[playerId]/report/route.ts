/**
 * API Route: Report Player
 * 
 * POST - Submit a report against a player
 * GET - Get my reports against this player (to check if already reported)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { playerReports, players, notifications } from '@/lib/db/schema';
import { getServerPlayer } from '@/lib/auth-helpers';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const REPORT_CATEGORIES = [
  'spam',
  'harassment', 
  'fake_profile',
  'cheating',
  'inappropriate',
  'other',
] as const;

// GET: Check if player has pending reports from current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // BUG-007 FIX: Next.js 15 requires awaiting params
    const { playerId } = await params;

    // Get pending reports from this user against the target
    const pendingReports = await db
      .select({
        id: playerReports.id,
        category: playerReports.category,
        status: playerReports.status,
        createdAt: playerReports.createdAt,
      })
      .from(playerReports)
      .where(
        and(
          eq(playerReports.reporterId, player.id),
          eq(playerReports.reportedId, playerId),
          eq(playerReports.status, 'pending')
        )
      )
      .orderBy(desc(playerReports.createdAt));

    return NextResponse.json({
      hasPendingReport: pendingReports.length > 0,
      pendingReports,
    });
  } catch (error) {
    console.error('Error checking report status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}

// POST: Submit a report
const reportSchema = z.object({
  category: z.enum(REPORT_CATEGORIES),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)').max(2000, 'Description trop longue (max 2000 caractères)'),
  evidenceUrls: z.array(z.string().url()).max(5).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // BUG-007 FIX: Next.js 15 requires awaiting params
    const { playerId } = await params;

    // Can't report yourself
    if (playerId === player.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous signaler vous-même' },
        { status: 400 }
      );
    }

    // Check if target player exists
    const [targetPlayer] = await db
      .select({ id: players.id, fullName: players.fullName, clubId: players.clubId })
      .from(players)
      .where(eq(players.id, playerId));

    if (!targetPlayer) {
      return NextResponse.json(
        { error: 'Joueur non trouvé' },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { category, description, evidenceUrls } = validation.data;

    // Check for duplicate pending reports (same reporter, same reported, same category)
    const [existingReport] = await db
      .select()
      .from(playerReports)
      .where(
        and(
          eq(playerReports.reporterId, player.id),
          eq(playerReports.reportedId, playerId),
          eq(playerReports.category, category),
          eq(playerReports.status, 'pending')
        )
      );

    if (existingReport) {
      return NextResponse.json({
        success: false,
        error: 'Vous avez déjà un signalement en cours pour ce motif',
        existingReportId: existingReport.id,
      }, { status: 400 });
    }

    // Create report
    const [newReport] = await db
      .insert(playerReports)
      .values({
        reporterId: player.id,
        reportedId: playerId,
        category,
        description,
        evidenceUrls: evidenceUrls || [],
      })
      .returning();

    console.log(`[Report] ${player.fullName} reported ${targetPlayer.fullName} for ${category}`);

    // Notify club admins if both are in the same club
    if (targetPlayer.clubId) {
      const admins = await db
        .select({ id: players.id })
        .from(players)
        .where(
          and(
            eq(players.clubId, targetPlayer.clubId),
            eq(players.isAdmin, true)
          )
        );

      // Create notifications for admins
      const categoryLabels: Record<string, string> = {
        spam: 'Spam',
        harassment: 'Harcèlement',
        fake_profile: 'Faux profil',
        cheating: 'Triche',
        inappropriate: 'Contenu inapproprié',
        other: 'Autre',
      };

      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: 'report_submitted',
          title: '🚨 Nouveau signalement',
          message: `${player.fullName} a signalé ${targetPlayer.fullName} pour: ${categoryLabels[category]}`,
          link: '/admin/reports',
          data: {
            reportId: newReport?.id,
            reporterId: player.id,
            reportedId: playerId,
            category,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Signalement envoyé. Nous examinerons votre rapport rapidement.',
      reportId: newReport?.id,
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { error: 'Erreur lors du signalement' },
      { status: 500 }
    );
  }
}
