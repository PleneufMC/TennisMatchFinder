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

/**
 * Configuration des poules équilibrées
 * 
 * Règles :
 * - Poule idéale : 4-6 joueurs (6-15 matchs par joueur)
 * - Minimum absolu : 2 joueurs par poule
 * - Maximum recommandé : 6 joueurs par poule (sinon trop de matchs)
 * - Seuil de fusion : si la différence entre poules > 2, on fusionne
 */
const POOL_CONFIG = {
  MIN_PLAYERS_PER_POOL: 3,  // Minimum pour un round-robin intéressant
  IDEAL_PLAYERS_PER_POOL: 4, // Taille idéale (6 matchs par joueur)
  MAX_PLAYERS_PER_POOL: 6,   // Maximum avant que ça devienne trop long
  MAX_SINGLE_POOL: 8,        // Au-delà, on divise obligatoirement
  IMBALANCE_THRESHOLD: 2,    // Différence max acceptée entre poules
};

/**
 * Calcule le nombre de matchs round-robin pour une poule
 * Formule : n(n-1)/2 où n = nombre de joueurs
 */
function calculateMatchesForPool(playerCount: number): number {
  return (playerCount * (playerCount - 1)) / 2;
}

/**
 * Calcule la configuration optimale des poules
 * 
 * @param participantCount - Nombre total de participants
 * @param requestedPoolCount - Nombre de poules demandé par l'admin
 * @param playersPerPool - Nombre de joueurs par poule demandé
 * @returns Configuration optimale { poolCount, poolSizes, totalMatches }
 */
function calculateOptimalPoolConfiguration(
  participantCount: number, 
  requestedPoolCount: number, 
  playersPerPool: number
): { poolCount: number; poolSizes: number[]; totalMatches: number; reason: string } {
  
  // Cas 1: Pas assez de joueurs → Annulation
  if (participantCount < 2) {
    return { poolCount: 0, poolSizes: [], totalMatches: 0, reason: 'Pas assez de participants (minimum 2)' };
  }
  
  // Cas 2: 2-3 joueurs → Une seule poule obligatoire
  if (participantCount <= 3) {
    return { 
      poolCount: 1, 
      poolSizes: [participantCount], 
      totalMatches: calculateMatchesForPool(participantCount),
      reason: `Poule unique de ${participantCount} joueurs`
    };
  }
  
  // Cas 3: 4-8 joueurs → Préférer une seule poule si <= MAX_SINGLE_POOL
  if (participantCount <= POOL_CONFIG.MAX_SINGLE_POOL) {
    // Une seule poule est plus équitable
    if (participantCount <= POOL_CONFIG.MAX_PLAYERS_PER_POOL || requestedPoolCount === 1) {
      return { 
        poolCount: 1, 
        poolSizes: [participantCount], 
        totalMatches: calculateMatchesForPool(participantCount),
        reason: `Poule unique de ${participantCount} joueurs (équilibré)`
      };
    }
    
    // Si l'admin veut plusieurs poules et qu'on a assez de joueurs
    if (requestedPoolCount >= 2 && participantCount >= 6) {
      const poolSizes = distributePlayersEvenly(participantCount, 2);
      const totalMatches = poolSizes.reduce((sum, size) => sum + calculateMatchesForPool(size), 0);
      return { 
        poolCount: 2, 
        poolSizes,
        totalMatches,
        reason: `2 poules équilibrées (${poolSizes.join(' + ')} joueurs)`
      };
    }
    
    // Sinon, une seule poule
    return { 
      poolCount: 1, 
      poolSizes: [participantCount], 
      totalMatches: calculateMatchesForPool(participantCount),
      reason: `Poule unique de ${participantCount} joueurs`
    };
  }
  
  // Cas 4: Plus de 8 joueurs → Calculer le nombre optimal de poules
  
  // Calculer le nombre idéal basé sur la taille de poule demandée
  let idealPoolCount = Math.ceil(participantCount / playersPerPool);
  
  // Ne pas dépasser le nombre demandé
  idealPoolCount = Math.min(idealPoolCount, requestedPoolCount);
  
  // S'assurer qu'on a au moins MIN_PLAYERS_PER_POOL par poule
  const maxPoolCount = Math.floor(participantCount / POOL_CONFIG.MIN_PLAYERS_PER_POOL);
  idealPoolCount = Math.min(idealPoolCount, maxPoolCount);
  
  // Minimum 1 poule
  idealPoolCount = Math.max(idealPoolCount, 1);
  
  // Distribuer les joueurs équitablement
  const poolSizes = distributePlayersEvenly(participantCount, idealPoolCount);
  
  // Vérifier l'équilibre : si la différence est trop grande, réduire le nombre de poules
  const minPoolSize = Math.min(...poolSizes);
  const maxPoolSize = Math.max(...poolSizes);
  
  if (maxPoolSize - minPoolSize > POOL_CONFIG.IMBALANCE_THRESHOLD && idealPoolCount > 1) {
    // Trop de déséquilibre, essayer avec moins de poules
    const reducedPoolCount = idealPoolCount - 1;
    const reducedPoolSizes = distributePlayersEvenly(participantCount, reducedPoolCount);
    const reducedMinSize = Math.min(...reducedPoolSizes);
    const reducedMaxSize = Math.max(...reducedPoolSizes);
    
    // Si c'est mieux équilibré, utiliser cette configuration
    if (reducedMaxSize - reducedMinSize < maxPoolSize - minPoolSize) {
      const totalMatches = reducedPoolSizes.reduce((sum, size) => sum + calculateMatchesForPool(size), 0);
      return { 
        poolCount: reducedPoolCount, 
        poolSizes: reducedPoolSizes,
        totalMatches,
        reason: `${reducedPoolCount} poules équilibrées (${reducedPoolSizes.join(' + ')} joueurs) - fusionné pour équilibre`
      };
    }
  }
  
  const totalMatches = poolSizes.reduce((sum, size) => sum + calculateMatchesForPool(size), 0);
  return { 
    poolCount: idealPoolCount, 
    poolSizes,
    totalMatches,
    reason: `${idealPoolCount} poules (${poolSizes.join(' + ')} joueurs)`
  };
}

/**
 * Distribue N joueurs en P poules de tailles aussi égales que possible
 * Ex: 7 joueurs, 2 poules → [4, 3]
 * Ex: 11 joueurs, 3 poules → [4, 4, 3]
 */
function distributePlayersEvenly(playerCount: number, poolCount: number): number[] {
  if (poolCount <= 0) return [];
  if (poolCount === 1) return [playerCount];
  
  const baseSize = Math.floor(playerCount / poolCount);
  const remainder = playerCount % poolCount;
  
  // Créer les poules : les premières ont baseSize + 1, les autres baseSize
  const poolSizes: number[] = [];
  for (let i = 0; i < poolCount; i++) {
    poolSizes.push(baseSize + (i < remainder ? 1 : 0));
  }
  
  // Trier par taille décroissante pour cohérence
  return poolSizes.sort((a, b) => b - a);
}

// Ancienne fonction maintenue pour compatibilité (retourne juste le count)
function calculateOptimalPoolCount(participantCount: number, requestedPoolCount: number, playersPerPool: number): number {
  const config = calculateOptimalPoolConfiguration(participantCount, requestedPoolCount, playersPerPool);
  return config.poolCount;
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
        const poolConfig = calculateOptimalPoolConfiguration(
          participants.length,
          league.poolCount,
          league.playersPerPool
        );

        console.log(`CRON: League "${league.name}" pool config:`, poolConfig);

        // Mélanger les participants (par ELO pour un meilleur équilibrage)
        // On trie par ELO puis on distribue en serpentin pour équilibrer les niveaux
        const sortedByElo = [...participants].sort((a, b) => b.eloAtStart - a.eloAtStart);
        
        // Distribuer selon les tailles de poules calculées
        const pools: ParticipantData[][] = [];
        let playerIndex = 0;
        
        for (const poolSize of poolConfig.poolSizes) {
          const pool: ParticipantData[] = [];
          for (let i = 0; i < poolSize && playerIndex < sortedByElo.length; i++) {
            // Distribution en serpentin pour équilibrer les ELO entre poules
            if (poolConfig.poolCount > 1) {
              // Serpentin : 0,1,1,0,0,1,1,0...
              const round = Math.floor(playerIndex / poolConfig.poolCount);
              const posInRound = playerIndex % poolConfig.poolCount;
              const targetPoolIndex = round % 2 === 0 ? posInRound : poolConfig.poolCount - 1 - posInRound;
              
              // Si cette poule est déjà pleine, passer à la suivante
              while (pools[targetPoolIndex] && pools[targetPoolIndex].length >= poolConfig.poolSizes[targetPoolIndex]!) {
                playerIndex++;
                if (playerIndex >= sortedByElo.length) break;
              }
            }
            
            pool.push(sortedByElo[playerIndex]!);
            playerIndex++;
          }
          if (pool.length > 0) {
            pools.push(pool);
          }
        }
        
        // Fallback : si la distribution serpentin a échoué, utiliser distribution simple
        if (pools.length === 0 || pools.reduce((sum, p) => sum + p.length, 0) !== participants.length) {
          pools.length = 0;
          playerIndex = 0;
          const shuffledParticipants = shuffleArray(participants);
          
          for (const poolSize of poolConfig.poolSizes) {
            const pool: ParticipantData[] = [];
            for (let i = 0; i < poolSize && playerIndex < shuffledParticipants.length; i++) {
              pool.push(shuffledParticipants[playerIndex]!);
              playerIndex++;
            }
            if (pool.length > 0) {
              pools.push(pool);
            }
          }
        }
        
        const optimalPoolCount = pools.length;

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
            // Calculer le nombre de matchs pour CE joueur (dans SA poule)
            const matchesForPlayer = pool.length - 1; // Round-robin : joue contre tous les autres de sa poule
            
            // Notification in-app
            await db.insert(notifications).values({
              userId: participant.playerId,
              type: 'box_league_started',
              title: `🏆 ${league.name} démarre !`,
              message: optimalPoolCount > 1
                ? `Tu es dans la Poule ${poolNumberToLetter(poolIndex + 1)} (${pool.length} joueurs). Tu as ${matchesForPlayer} matchs à jouer. C'est parti !`
                : `La compétition démarre avec ${participants.length} joueurs. Tu as ${matchesForPlayer} matchs à jouer contre chaque adversaire. C'est parti !`,
              link: `/box-leagues/${league.id}`,
              data: {
                leagueId: league.id,
                poolNumber: poolIndex + 1,
                poolLetter: poolNumberToLetter(poolIndex + 1),
                poolSize: pool.length,
                matchCount: matchesForPlayer,
              },
            });

            // Notification WhatsApp si activé
            if (participant.whatsappOptIn && participant.whatsappNumber) {
              const poolLetter = optimalPoolCount > 1 ? poolNumberToLetter(poolIndex + 1) : null;
              await notifyBoxLeagueStarted(
                participant.whatsappNumber,
                participant.playerName,
                league.name,
                poolLetter,
                matchesForPlayer
              );
            }
          })
        );

        await Promise.all(notificationPromises);

        // Créer le résumé des tailles de poules
        const poolSizeSummary = pools.map((p, i) => `${poolNumberToLetter(i + 1)}:${p.length}`).join(', ');

        results.push({
          leagueId: league.id,
          leagueName: league.name,
          action: 'started',
          participants: participants.length,
          pools: optimalPoolCount,
          message: `Démarrée avec ${participants.length} joueurs en ${optimalPoolCount} poule(s) [${poolSizeSummary}], ${matchesToCreate.length} matchs générés. ${poolConfig.reason}`,
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
