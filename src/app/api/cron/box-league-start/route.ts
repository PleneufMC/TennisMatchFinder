/**
 * CRON Job: Box League Auto-Start
 * 
 * Exécuté toutes les heures pour :
 * 1. Détecter les Box Leagues dont registrationDeadline est passée
 * 2. Adapter le nombre de poules au nombre réel de participants
 * 3. Effectuer le tirage au sort automatiquement
 * 4. Générer les matchs et passer en status "active"
 * 5. Notifier les participants
 * 
 * Schedule: Toutes les heures (0 * * * *)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  boxLeagues, 
  boxLeagueParticipants, 
  boxLeagueMatches,
  players, 
  notifications 
} from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { notifyBoxLeagueStarted, notifyBoxLeagueCancelled } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// Clé secrète pour sécuriser le CRON (configurée dans Netlify)
const CRON_SECRET = process.env.CRON_SECRET;

// Fonction pour mélanger un tableau (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

// Fonction pour répartir en poules (méthode serpentin)
function distributeInPools<T>(items: T[], poolCount: number): T[][] {
  const pools: T[][] = Array.from({ length: poolCount }, () => []);
  
  items.forEach((item, index) => {
    // Méthode serpentin : 0,1,2,2,1,0,0,1,2...
    const round = Math.floor(index / poolCount);
    const posInRound = index % poolCount;
    const poolIndex = round % 2 === 0 ? posInRound : poolCount - 1 - posInRound;
    pools[poolIndex]!.push(item);
  });
  
  return pools;
}

// Convertir numéro de poule en lettre
function poolNumberToLetter(num: number): string {
  return String.fromCharCode(64 + num); // 1 -> A, 2 -> B, 3 -> C
}

// Calcule le nombre optimal de poules selon le nombre de participants
function calculateOptimalPoolCount(participantCount: number, requestedPoolCount: number, playersPerPool: number): number {
  // Cas spéciaux : pas assez de monde
  if (participantCount < 2) return 0; // Annulation
  if (participantCount <= 6) return 1; // Une seule poule
  
  // Calculer le nombre idéal de poules
  const idealPoolCount = Math.ceil(participantCount / playersPerPool);
  
  // Ne pas dépasser le nombre demandé initialement
  const actualPoolCount = Math.min(idealPoolCount, requestedPoolCount);
  
  // S'assurer qu'on a au moins 2 joueurs par poule
  const minPoolCount = Math.floor(participantCount / 2);
  
  return Math.min(actualPoolCount, minPoolCount);
}

interface ParticipantData {
  id: string;
  playerId: string;
  eloAtStart: number;
  playerName: string;
  whatsappNumber: string | null;
  whatsappOptIn: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Vérification de sécurité (Netlify envoie ce header pour les scheduled functions)
    const authHeader = request.headers.get('authorization');
    const isNetlifyScheduled = request.headers.get('x-netlify-event') === 'schedule';
    
    // Accepter si c'est un appel Netlify schedulé OU si le secret est correct
    if (!isNetlifyScheduled && authHeader !== `Bearer ${CRON_SECRET}` && CRON_SECRET) {
      console.log('CRON box-league-start: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('CRON box-league-start: Starting automatic box league processing...');

    const now = new Date();
    
    // Trouver les Box Leagues en phase d'inscription dont la deadline est passée
    const leaguesToProcess = await db
      .select()
      .from(boxLeagues)
      .where(
        and(
          eq(boxLeagues.status, 'registration'),
          lte(boxLeagues.registrationDeadline, now),
          eq(boxLeagues.poolsDrawn, false)
        )
      );

    console.log(`CRON box-league-start: Found ${leaguesToProcess.length} leagues to process`);

    const results: Array<{
      leagueId: string;
      leagueName: string;
      action: 'started' | 'cancelled' | 'error';
      participants: number;
      pools: number;
      message: string;
    }> = [];

    for (const league of leaguesToProcess) {
      try {
        // Récupérer les participants actifs avec leurs préférences WhatsApp
        const participants = await db
          .select({
            id: boxLeagueParticipants.id,
            playerId: boxLeagueParticipants.playerId,
            eloAtStart: boxLeagueParticipants.eloAtStart,
            playerName: players.fullName,
            whatsappNumber: players.whatsappNumber,
            whatsappOptIn: players.whatsappOptIn,
          })
          .from(boxLeagueParticipants)
          .innerJoin(players, eq(boxLeagueParticipants.playerId, players.id))
          .where(
            and(
              eq(boxLeagueParticipants.leagueId, league.id),
              eq(boxLeagueParticipants.isActive, true)
            )
          );

        console.log(`CRON: League "${league.name}" has ${participants.length} participants`);

        // Cas 1: Pas assez de participants (0-1) → Annuler
        if (participants.length < 2) {
          await db
            .update(boxLeagues)
            .set({ 
              status: 'cancelled',
              updatedAt: now,
            })
            .where(eq(boxLeagues.id, league.id));

          // Notifier les participants (s'il y en a)
          if (participants.length === 1) {
            const participant = participants[0]!;
            await db.insert(notifications).values({
              userId: participant.playerId,
              type: 'box_league_cancelled',
              title: `❌ ${league.name} annulée`,
              message: `La Box League a été annulée faute de participants suffisants (minimum 2 requis).`,
              link: `/box-leagues`,
              data: { leagueId: league.id },
            });

            // Notification WhatsApp si activé
            if (participant.whatsappOptIn && participant.whatsappNumber) {
              await notifyBoxLeagueCancelled(
                participant.whatsappNumber,
                participant.playerName,
                league.name,
                'Pas assez de participants (minimum 2 requis)'
              );
            }
          }

          results.push({
            leagueId: league.id,
            leagueName: league.name,
            action: 'cancelled',
            participants: participants.length,
            pools: 0,
            message: 'Annulée - pas assez de participants',
          });

          continue;
        }

        // Cas 2: Assez de participants → Calculer les poules et démarrer
        const optimalPoolCount = calculateOptimalPoolCount(
          participants.length,
          league.poolCount,
          league.playersPerPool
        );

        // Mélanger les participants
        const shuffledParticipants = shuffleArray(participants);

        // Répartir en poules
        const pools = distributeInPools(shuffledParticipants, optimalPoolCount);

        // Mettre à jour chaque participant avec son numéro de poule
        const updatePromises = pools.flatMap((pool, poolIndex) =>
          pool.map((participant) =>
            db
              .update(boxLeagueParticipants)
              .set({ 
                poolNumber: poolIndex + 1,
                updatedAt: now,
              })
              .where(eq(boxLeagueParticipants.id, participant.id))
          )
        );

        await Promise.all(updatePromises);

        // Générer les matchs round-robin pour chaque poule
        const matchesToCreate: Array<{
          leagueId: string;
          player1Id: string;
          player2Id: string;
          deadline: Date;
        }> = [];

        for (const pool of pools) {
          for (let i = 0; i < pool.length; i++) {
            for (let j = i + 1; j < pool.length; j++) {
              matchesToCreate.push({
                leagueId: league.id,
                player1Id: pool[i]!.playerId,
                player2Id: pool[j]!.playerId,
                deadline: league.endDate,
              });
            }
          }
        }

        if (matchesToCreate.length > 0) {
          await db.insert(boxLeagueMatches).values(matchesToCreate);
        }

        // Mettre à jour la league : poolsDrawn = true, poolCount adapté, status = active
        await db
          .update(boxLeagues)
          .set({ 
            poolsDrawn: true,
            poolCount: optimalPoolCount,
            status: 'active',
            updatedAt: now,
          })
          .where(eq(boxLeagues.id, league.id));

        // Notifier tous les participants (in-app + WhatsApp)
        const notificationPromises = pools.flatMap((pool, poolIndex) =>
          pool.map(async (participant) => {
            // Notification in-app
            await db.insert(notifications).values({
              userId: participant.playerId,
              type: 'box_league_started',
              title: `🏆 ${league.name} démarre !`,
              message: optimalPoolCount > 1
                ? `Tu es dans la Poule ${poolNumberToLetter(poolIndex + 1)}. ${pool.length} joueurs, ${matchesToCreate.length / optimalPoolCount} matchs à jouer. C'est parti !`
                : `La compétition démarre avec ${participants.length} joueurs. ${matchesToCreate.length} matchs à jouer. C'est parti !`,
              link: `/box-leagues/${league.id}`,
              data: {
                leagueId: league.id,
                poolNumber: poolIndex + 1,
                poolLetter: poolNumberToLetter(poolIndex + 1),
              },
            });

            // Notification WhatsApp si activé
            if (participant.whatsappOptIn && participant.whatsappNumber) {
              const poolLetter = optimalPoolCount > 1 ? poolNumberToLetter(poolIndex + 1) : null;
              const matchCount = Math.floor(matchesToCreate.length / optimalPoolCount);
              await notifyBoxLeagueStarted(
                participant.whatsappNumber,
                participant.playerName,
                league.name,
                poolLetter,
                matchCount
              );
            }
          })
        );

        await Promise.all(notificationPromises);

        results.push({
          leagueId: league.id,
          leagueName: league.name,
          action: 'started',
          participants: participants.length,
          pools: optimalPoolCount,
          message: `Démarrée avec ${participants.length} joueurs en ${optimalPoolCount} poule(s), ${matchesToCreate.length} matchs générés`,
        });

        console.log(`CRON: League "${league.name}" started successfully`);

      } catch (leagueError) {
        console.error(`CRON: Error processing league ${league.id}:`, leagueError);
        results.push({
          leagueId: league.id,
          leagueName: league.name,
          action: 'error',
          participants: 0,
          pools: 0,
          message: leagueError instanceof Error ? leagueError.message : 'Erreur inconnue',
        });
      }
    }

    const summary = {
      processedAt: now.toISOString(),
      totalLeagues: leaguesToProcess.length,
      started: results.filter(r => r.action === 'started').length,
      cancelled: results.filter(r => r.action === 'cancelled').length,
      errors: results.filter(r => r.action === 'error').length,
      details: results,
    };

    console.log('CRON box-league-start: Completed', JSON.stringify(summary, null, 2));

    return NextResponse.json({
      success: true,
      ...summary,
    });

  } catch (error) {
    console.error('CRON box-league-start: Fatal error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du traitement automatique des Box Leagues',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

// GET pour vérifier le statut (debug/monitoring)
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // Compter les leagues en attente de traitement
    const pendingLeagues = await db
      .select({
        id: boxLeagues.id,
        name: boxLeagues.name,
        registrationDeadline: boxLeagues.registrationDeadline,
        participantCount: sql<number>`(
          SELECT COUNT(*) FROM box_league_participants 
          WHERE league_id = ${boxLeagues.id} AND is_active = true
        )::int`,
      })
      .from(boxLeagues)
      .where(
        and(
          eq(boxLeagues.status, 'registration'),
          eq(boxLeagues.poolsDrawn, false)
        )
      );

    const deadlinePassed = pendingLeagues.filter(
      l => new Date(l.registrationDeadline) <= now
    );

    return NextResponse.json({
      status: 'ok',
      currentTime: now.toISOString(),
      pendingLeagues: pendingLeagues.length,
      readyToProcess: deadlinePassed.length,
      leagues: pendingLeagues.map(l => ({
        id: l.id,
        name: l.name,
        deadline: l.registrationDeadline,
        deadlinePassed: new Date(l.registrationDeadline) <= now,
        participants: l.participantCount,
      })),
    });

  } catch (error) {
    console.error('CRON box-league-start GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
