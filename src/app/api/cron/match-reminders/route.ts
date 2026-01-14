/**
 * API Route: Match Reminders CRON
 * POST - Envoie des rappels pour les matchs en attente de confirmation (après 6h)
 * 
 * Exécution : Toutes les heures via Netlify Scheduled Function
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches, players, notifications } from '@/lib/db/schema';
import { eq, and, lte, gte, isNull } from 'drizzle-orm';
import { 
  MATCH_VALIDATION_CONFIG, 
  VALIDATION_MESSAGES,
  getReminderDate 
} from '@/lib/constants/validation';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification CRON
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Match Reminders] CRON_SECRET not configured');
      return NextResponse.json({ error: 'CRON not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Match Reminders] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Match Reminders] Starting reminder check...');

    const now = new Date();
    
    // Calculer la fenêtre de rappel (matchs créés il y a plus de 6h mais pas encore rappelés)
    const reminderThreshold = new Date(now);
    reminderThreshold.setHours(reminderThreshold.getHours() - MATCH_VALIDATION_CONFIG.reminderAfterHours);

    // Trouver les matchs qui ont besoin d'un rappel
    const matchesNeedingReminder = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.validated, false),
          eq(matches.contested, false),
          isNull(matches.reminderSentAt),
          lte(matches.createdAt, reminderThreshold)
        )
      );

    console.log(`[Match Reminders] Found ${matchesNeedingReminder.length} matches needing reminder`);

    let remindersSent = 0;
    const errors: string[] = [];

    for (const match of matchesNeedingReminder) {
      try {
        // Déterminer qui doit recevoir le rappel (l'adversaire du rapporteur)
        const recipientId = match.reportedBy === match.player1Id 
          ? match.player2Id 
          : match.player1Id;

        // Récupérer le nom du rapporteur
        const [reporter] = await db
          .select({ fullName: players.fullName })
          .from(players)
          .where(eq(players.id, match.reportedBy!))
          .limit(1);

        // Calculer les heures restantes avant auto-validation
        const hoursLeft = match.autoValidateAt 
          ? Math.max(0, Math.ceil((match.autoValidateAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
          : MATCH_VALIDATION_CONFIG.autoValidateAfterHours - MATCH_VALIDATION_CONFIG.reminderAfterHours;

        const reminderMsg = VALIDATION_MESSAGES.reminder(
          reporter?.fullName || 'Un joueur',
          hoursLeft
        );

        // Envoyer la notification de rappel
        await db.insert(notifications).values({
          userId: recipientId,
          type: 'match_reminder',
          title: reminderMsg.title,
          message: reminderMsg.body,
          link: `/matchs/confirmer/${match.id}`,
          data: {
            matchId: match.id,
            reporterName: reporter?.fullName,
            score: match.score,
            hoursLeft,
            autoValidateAt: match.autoValidateAt?.toISOString(),
          },
        });

        // Marquer le rappel comme envoyé
        await db
          .update(matches)
          .set({
            reminderSentAt: now,
            updatedAt: now,
          })
          .where(eq(matches.id, match.id));

        remindersSent++;
        console.log(`[Match Reminders] Reminder sent for match ${match.id}`);
      } catch (error) {
        const errorMsg = `Failed to send reminder for match ${match.id}: ${error}`;
        console.error(`[Match Reminders] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        matchesFound: matchesNeedingReminder.length,
        remindersSent,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('[Match Reminders] Completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Match Reminders] Critical error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Endpoint de test/preview
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const reminderThreshold = new Date(now);
    reminderThreshold.setHours(reminderThreshold.getHours() - MATCH_VALIDATION_CONFIG.reminderAfterHours);

    const matchesNeedingReminder = await db
      .select({
        id: matches.id,
        score: matches.score,
        createdAt: matches.createdAt,
        autoValidateAt: matches.autoValidateAt,
        reportedBy: matches.reportedBy,
      })
      .from(matches)
      .where(
        and(
          eq(matches.validated, false),
          eq(matches.contested, false),
          isNull(matches.reminderSentAt),
          lte(matches.createdAt, reminderThreshold)
        )
      );

    return NextResponse.json({
      status: 'ready',
      timestamp: now.toISOString(),
      config: {
        reminderAfterHours: MATCH_VALIDATION_CONFIG.reminderAfterHours,
        autoValidateAfterHours: MATCH_VALIDATION_CONFIG.autoValidateAfterHours,
      },
      preview: {
        matchesCount: matchesNeedingReminder.length,
        matches: matchesNeedingReminder.slice(0, 10),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
