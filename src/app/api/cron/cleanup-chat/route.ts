import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages } from '@/lib/db/schema';
import { lt, sql } from 'drizzle-orm';

// Durée de rétention des messages (24 heures)
const MESSAGE_RETENTION_HOURS = 24;

// Clé secrète pour protéger l'endpoint (à configurer dans les variables d'environnement)
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * API de nettoyage des messages de chat > 24h
 * 
 * Cette API peut être appelée par :
 * 1. Un cron job Netlify (scheduled functions)
 * 2. Un service externe comme cron-job.org
 * 3. Manuellement pour tester
 * 
 * Sécurité : Nécessite le header Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'autorisation
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    // En production, vérifier le secret
    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
      console.warn('Unauthorized cron access attempt');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Calculer la date limite (24h avant maintenant)
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - MESSAGE_RETENTION_HOURS);

    // Compter les messages à supprimer (pour le log)
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(lt(chatMessages.createdAt, cutoffDate));
    
    const messageCount = countResult[0]?.count || 0;

    if (messageCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun message à supprimer',
        deletedCount: 0,
        cutoffDate: cutoffDate.toISOString(),
      });
    }

    // Supprimer les messages
    const deleteResult = await db
      .delete(chatMessages)
      .where(lt(chatMessages.createdAt, cutoffDate));

    console.log(`[CRON] Cleaned up ${messageCount} chat messages older than ${MESSAGE_RETENTION_HOURS}h`);

    return NextResponse.json({
      success: true,
      message: `${messageCount} message(s) supprimé(s)`,
      deletedCount: messageCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionHours: MESSAGE_RETENTION_HOURS,
    });
  } catch (error) {
    console.error('[CRON] Error cleaning up chat messages:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du nettoyage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET pour vérifier le statut (sans supprimer)
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'autorisation
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - MESSAGE_RETENTION_HOURS);

    // Compter les messages qui seraient supprimés
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(lt(chatMessages.createdAt, cutoffDate));

    // Compter le total des messages
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages);

    return NextResponse.json({
      status: 'ready',
      retentionHours: MESSAGE_RETENTION_HOURS,
      cutoffDate: cutoffDate.toISOString(),
      messagesToDelete: countResult[0]?.count || 0,
      totalMessages: totalResult[0]?.count || 0,
      note: 'Utilisez POST pour exécuter le nettoyage',
    });
  } catch (error) {
    console.error('[CRON] Error checking chat cleanup status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
