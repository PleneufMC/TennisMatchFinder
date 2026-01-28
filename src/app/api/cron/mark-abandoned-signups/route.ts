/**
 * API Route: Mark Abandoned Signups CRON
 * POST - Marque les tentatives d'inscription comme abandonnées après 1h d'inactivité
 * 
 * Exécution : Toutes les heures via Netlify Scheduled Function
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signupAttempts } from '@/lib/db/schema';
import { eq, and, lte, isNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification CRON
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Mark-Abandoned] CRON_SECRET not configured');
      return NextResponse.json({ error: 'CRON not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Mark-Abandoned] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Mark-Abandoned] Starting abandoned signup check...');

    // Marquer comme abandonnées les tentatives :
    // - en status 'started' ou 'in_progress'
    // - non converties (convertedUserId IS NULL)
    // - mises à jour il y a plus d'1 heure
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await db
      .update(signupAttempts)
      .set({
        status: 'abandoned',
        updatedAt: new Date(),
      })
      .where(
        and(
          // Status en cours
          eq(signupAttempts.status, 'in_progress'),
          // Non converti
          isNull(signupAttempts.convertedUserId),
          // Dernière mise à jour il y a plus d'1 heure
          lte(signupAttempts.updatedAt, oneHourAgo)
        )
      )
      .returning({ id: signupAttempts.id, email: signupAttempts.email });

    // Également marquer les tentatives "started" de plus d'1 heure
    const resultStarted = await db
      .update(signupAttempts)
      .set({
        status: 'abandoned',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(signupAttempts.status, 'started'),
          isNull(signupAttempts.convertedUserId),
          lte(signupAttempts.updatedAt, oneHourAgo)
        )
      )
      .returning({ id: signupAttempts.id, email: signupAttempts.email });

    const totalMarked = result.length + resultStarted.length;
    const withEmail = [...result, ...resultStarted].filter(r => r.email).length;

    console.log(`[Mark-Abandoned] Marked ${totalMarked} attempts as abandoned (${withEmail} with email)`);

    return NextResponse.json({
      success: true,
      markedAsAbandoned: totalMarked,
      withEmail,
      details: {
        fromInProgress: result.length,
        fromStarted: resultStarted.length,
      },
    });
  } catch (error) {
    console.error('[Mark-Abandoned] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du marquage des abandons' },
      { status: 500 }
    );
  }
}
