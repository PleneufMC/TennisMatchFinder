/**
 * CRON Job: Process Account Deletions
 * 
 * Exécuté quotidiennement pour traiter les demandes de suppression
 * dont le délai de grâce (7 jours) est passé.
 * 
 * Schedule: Tous les jours à 3h du matin (0 3 * * *)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPendingDeletions } from '@/lib/account/deletion-service';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Vérification de sécurité
    const authHeader = request.headers.get('authorization');
    const isNetlifyScheduled = request.headers.get('x-netlify-event') === 'schedule';
    
    if (!isNetlifyScheduled && authHeader !== `Bearer ${CRON_SECRET}` && CRON_SECRET) {
      console.log('CRON process-deletions: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('CRON process-deletions: Starting...');

    const result = await processPendingDeletions();

    console.log('CRON process-deletions: Completed', result);

    return NextResponse.json({
      success: true,
      processedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error('CRON process-deletions: Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du traitement des suppressions',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

// GET pour vérifier le statut (monitoring)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'process-deletions',
    description: 'Traite les demandes de suppression de compte après le délai de grâce',
    schedule: 'Daily at 3:00 AM',
  });
}
