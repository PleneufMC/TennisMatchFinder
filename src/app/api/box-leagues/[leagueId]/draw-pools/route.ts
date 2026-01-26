/**
 * API Route: Draw Pools for Box League
 * 
 * POST - Effectue le tirage au sort pour répartir les joueurs en poules
 *        S'adapte automatiquement au nombre réel de participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { boxLeagues, boxLeagueParticipants, boxLeagueMatches, players, notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ leagueId: string }>;
}

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

// Convertir numéro de poule en lettre
function poolNumberToLetter(num: number): string {
  return String.fromCharCode(64 + num); // 1 -> A, 2 -> B, 3 -> C
}

/**
 * Configuration des poules équilibrées
 */
const POOL_CONFIG = {
  MIN_PLAYERS_PER_POOL: 3,
  IDEAL_PLAYERS_PER_POOL: 4,
  MAX_PLAYERS_PER_POOL: 6,
  MAX_SINGLE_POOL: 8,
  IMBALANCE_THRESHOLD: 2,
};

/**
 * Calcule le nombre de matchs round-robin pour une poule
 */
function calculateMatchesForPool(playerCount: number): number {
  return (playerCount * (playerCount - 1)) / 2;
}

/**
 * Distribue N joueurs en P poules de tailles aussi égales que possible
 */
function distributePlayersEvenly(playerCount: number, poolCount: number): number[] {
  if (poolCount <= 0) return [];
  if (poolCount === 1) return [playerCount];
  
  const baseSize = Math.floor(playerCount / poolCount);
  const remainder = playerCount % poolCount;
  
  const poolSizes: number[] = [];
  for (let i = 0; i < poolCount; i++) {
    poolSizes.push(baseSize + (i < remainder ? 1 : 0));
  }
  
  return poolSizes.sort((a, b) => b - a);
}

/**
 * Calcule la configuration optimale des poules
 */
function calculateOptimalPoolConfiguration(
  participantCount: number, 
  requestedPoolCount: number, 
  playersPerPool: number
): { poolCount: number; poolSizes: number[]; totalMatches: number; reason: string } {
  
  if (participantCount < 2) {
    return { poolCount: 0, poolSizes: [], totalMatches: 0, reason: 'Pas assez de participants' };
  }
  
  if (participantCount <= 3) {
    return { 
      poolCount: 1, 
      poolSizes: [participantCount], 
      totalMatches: calculateMatchesForPool(participantCount),
      reason: `Poule unique de ${participantCount} joueurs`
    };
  }
  
  // 4-8 joueurs : préférer une seule poule si possible
  if (participantCount <= POOL_CONFIG.MAX_SINGLE_POOL) {
    if (participantCount <= POOL_CONFIG.MAX_PLAYERS_PER_POOL || requestedPoolCount === 1) {
      return { 
        poolCount: 1, 
        poolSizes: [participantCount], 
        totalMatches: calculateMatchesForPool(participantCount),
        reason: `Poule unique équilibrée`
      };
    }
    
    if (requestedPoolCount >= 2 && participantCount >= 6) {
      const poolSizes = distributePlayersEvenly(participantCount, 2);
      const totalMatches = poolSizes.reduce((sum, size) => sum + calculateMatchesForPool(size), 0);
      return { 
        poolCount: 2, 
        poolSizes,
        totalMatches,
        reason: `2 poules équilibrées (${poolSizes.join('+')})`
      };
    }
    
    return { 
      poolCount: 1, 
      poolSizes: [participantCount], 
      totalMatches: calculateMatchesForPool(participantCount),
      reason: `Poule unique`
    };
  }
  
  // Plus de 8 joueurs
  let idealPoolCount = Math.ceil(participantCount / playersPerPool);
  idealPoolCount = Math.min(idealPoolCount, requestedPoolCount);
  
  const maxPoolCount = Math.floor(participantCount / POOL_CONFIG.MIN_PLAYERS_PER_POOL);
  idealPoolCount = Math.min(idealPoolCount, maxPoolCount);
  idealPoolCount = Math.max(idealPoolCount, 1);
  
  const poolSizes = distributePlayersEvenly(participantCount, idealPoolCount);
  
  // Vérifier l'équilibre
  const minPoolSize = Math.min(...poolSizes);
  const maxPoolSize = Math.max(...poolSizes);
  
  if (maxPoolSize - minPoolSize > POOL_CONFIG.IMBALANCE_THRESHOLD && idealPoolCount > 1) {
    const reducedPoolCount = idealPoolCount - 1;
    const reducedPoolSizes = distributePlayersEvenly(participantCount, reducedPoolCount);
    const reducedMinSize = Math.min(...reducedPoolSizes);
    const reducedMaxSize = Math.max(...reducedPoolSizes);
    
    if (reducedMaxSize - reducedMinSize < maxPoolSize - minPoolSize) {
      const totalMatches = reducedPoolSizes.reduce((sum, size) => sum + calculateMatchesForPool(size), 0);
      return { 
        poolCount: reducedPoolCount, 
        poolSizes: reducedPoolSizes,
        totalMatches,
        reason: `${reducedPoolCount} poules équilibrées (fusionné)`
      };
    }
  }
  
  const totalMatches = poolSizes.reduce((sum, size) => sum + calculateMatchesForPool(size), 0);
  return { 
    poolCount: idealPoolCount, 
    poolSizes,
    totalMatches,
    reason: `${idealPoolCount} poules (${poolSizes.join('+')})`
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!player.isAdmin) {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent effectuer le tirage' },
        { status: 403 }
      );
    }

    const { leagueId } = await params;

    // Récupérer la Box League
    const [league] = await db
      .select()
      .from(boxLeagues)
      .where(eq(boxLeagues.id, leagueId))
      .limit(1);

    if (!league) {
      return NextResponse.json({ error: 'Box League non trouvée' }, { status: 404 });
    }

    // Vérifier que la league appartient au club du joueur
    if (league.clubId !== player.clubId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Vérifier que le tirage n'a pas déjà été fait
    if (league.poolsDrawn) {
      return NextResponse.json(
        { error: 'Le tirage a déjà été effectué pour cette Box League' },
        { status: 400 }
      );
    }

    // Vérifier le statut
    if (!['draft', 'registration'].includes(league.status)) {
      return NextResponse.json(
        { error: 'Le tirage ne peut être effectué que pendant les inscriptions' },
        { status: 400 }
      );
    }

    // Récupérer tous les participants actifs
    const participants = await db
      .select({
        id: boxLeagueParticipants.id,
        playerId: boxLeagueParticipants.playerId,
        eloAtStart: boxLeagueParticipants.eloAtStart,
        playerName: players.fullName,
      })
      .from(boxLeagueParticipants)
      .innerJoin(players, eq(boxLeagueParticipants.playerId, players.id))
      .where(
        and(
          eq(boxLeagueParticipants.leagueId, leagueId),
          eq(boxLeagueParticipants.isActive, true)
        )
      );

    // Vérification minimum : il faut au moins 2 participants
    if (participants.length < 2) {
      return NextResponse.json(
        { 
          error: `Pas assez de participants. Minimum requis: 2 joueurs (actuellement: ${participants.length}).` 
        },
        { status: 400 }
      );
    }

    // Calculer la configuration optimale des poules
    const poolConfig = calculateOptimalPoolConfiguration(
      participants.length,
      league.poolCount,
      league.playersPerPool
    );

    const poolCountChanged = poolConfig.poolCount !== league.poolCount;

    // Trier par ELO pour distribution équilibrée, puis mélanger pour le fun
    const sortedByElo = [...participants].sort((a, b) => b.eloAtStart - a.eloAtStart);
    
    // Distribuer selon les tailles de poules calculées (serpentin par ELO)
    type ParticipantType = typeof participants[0];
    const pools: ParticipantType[][] = [];
    
    for (const poolSize of poolConfig.poolSizes) {
      pools.push([]);
    }
    
    // Distribution serpentin pour équilibrer les ELO entre poules
    sortedByElo.forEach((participant, index) => {
      if (poolConfig.poolCount === 1) {
        pools[0]!.push(participant);
      } else {
        const round = Math.floor(index / poolConfig.poolCount);
        const posInRound = index % poolConfig.poolCount;
        const poolIndex = round % 2 === 0 ? posInRound : poolConfig.poolCount - 1 - posInRound;
        
        // S'assurer qu'on ne dépasse pas la taille de la poule
        let targetPool = poolIndex;
        while (pools[targetPool] && pools[targetPool]!.length >= poolConfig.poolSizes[targetPool]!) {
          targetPool = (targetPool + 1) % poolConfig.poolCount;
        }
        pools[targetPool]!.push(participant);
      }
    });
    
    // Mélanger l'ordre dans chaque poule pour le fun
    pools.forEach(pool => {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j]!, pool[i]!];
      }
    });
    
    const optimalPoolCount = pools.length;

    // Mettre à jour chaque participant avec son numéro de poule
    const updatePromises = pools.flatMap((pool, poolIndex) =>
      pool.map((participant) =>
        db
          .update(boxLeagueParticipants)
          .set({ 
            poolNumber: poolIndex + 1,
            updatedAt: new Date(),
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
            leagueId,
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

    // Marquer le tirage comme effectué + mettre à jour le poolCount si adapté + passer en active
    await db
      .update(boxLeagues)
      .set({ 
        poolsDrawn: true,
        poolCount: optimalPoolCount,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(boxLeagues.id, leagueId));

    // Envoyer des notifications à tous les participants
    const notificationPromises = pools.flatMap((pool, poolIndex) =>
      pool.map((participant) => {
        const matchesForPlayer = pool.length - 1;
        return db.insert(notifications).values({
          userId: participant.playerId,
          type: 'box_league_started',
          title: `🏆 ${league.name} démarre !`,
          message: optimalPoolCount > 1
            ? `Tu es dans la Poule ${poolNumberToLetter(poolIndex + 1)} (${pool.length} joueurs). Tu as ${matchesForPlayer} matchs à jouer !`
            : `La compétition démarre avec ${participants.length} joueurs. Tu as ${matchesForPlayer} matchs à jouer !`,
          link: `/box-leagues/${leagueId}`,
          data: {
            leagueId,
            poolNumber: poolIndex + 1,
            poolLetter: poolNumberToLetter(poolIndex + 1),
            poolSize: pool.length,
            matchCount: matchesForPlayer,
          },
        });
      })
    );

    await Promise.all(notificationPromises);

    // Construire le résultat
    const result = pools.map((pool, index) => ({
      poolNumber: index + 1,
      poolLetter: poolNumberToLetter(index + 1),
      size: pool.length,
      matchesPerPlayer: pool.length - 1,
      totalMatches: calculateMatchesForPool(pool.length),
      players: pool.map((p) => ({
        id: p.playerId,
        name: p.playerName,
        elo: p.eloAtStart,
      })),
    }));

    // Résumé des tailles de poules
    const poolSizeSummary = pools.map((p, i) => `${poolNumberToLetter(i + 1)}:${p.length}`).join(', ');
    const adaptationMessage = poolCountChanged 
      ? ` (adapté de ${league.poolCount} à ${optimalPoolCount} poule(s))`
      : '';

    return NextResponse.json({
      success: true,
      message: `Tirage effectué ! ${participants.length} joueurs en ${optimalPoolCount} poule(s) [${poolSizeSummary}]${adaptationMessage}. ${matchesToCreate.length} matchs générés. ${poolConfig.reason}`,
      pools: result,
      matchesGenerated: matchesToCreate.length,
      poolCountAdapted: poolCountChanged,
      configuration: poolConfig,
    });
  } catch (error) {
    console.error('Error drawing pools:', error);
    return NextResponse.json(
      { error: 'Erreur lors du tirage au sort' },
      { status: 500 }
    );
  }
}

// GET - Voir la répartition actuelle des poules
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const player = await getServerPlayer();
    if (!player) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { leagueId } = await params;

    // Récupérer la Box League
    const [league] = await db
      .select()
      .from(boxLeagues)
      .where(eq(boxLeagues.id, leagueId))
      .limit(1);

    if (!league) {
      return NextResponse.json({ error: 'Box League non trouvée' }, { status: 404 });
    }

    // Vérifier que la league appartient au club du joueur
    if (league.clubId !== player.clubId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer tous les participants avec leur poule
    const participants = await db
      .select({
        id: boxLeagueParticipants.id,
        playerId: boxLeagueParticipants.playerId,
        poolNumber: boxLeagueParticipants.poolNumber,
        eloAtStart: boxLeagueParticipants.eloAtStart,
        points: boxLeagueParticipants.points,
        matchesPlayed: boxLeagueParticipants.matchesPlayed,
        matchesWon: boxLeagueParticipants.matchesWon,
        playerName: players.fullName,
        playerAvatar: players.avatarUrl,
        currentElo: players.currentElo,
      })
      .from(boxLeagueParticipants)
      .innerJoin(players, eq(boxLeagueParticipants.playerId, players.id))
      .where(
        and(
          eq(boxLeagueParticipants.leagueId, leagueId),
          eq(boxLeagueParticipants.isActive, true)
        )
      );

    // Grouper par poule
    const poolsMap = new Map<number, typeof participants>();
    
    participants.forEach((p) => {
      const poolNum = p.poolNumber || 0;
      if (!poolsMap.has(poolNum)) {
        poolsMap.set(poolNum, []);
      }
      poolsMap.get(poolNum)!.push(p);
    });

    // Convertir en tableau
    const pools = Array.from(poolsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([poolNumber, poolPlayers]) => ({
        poolNumber,
        poolLetter: poolNumber > 0 ? poolNumberToLetter(poolNumber) : 'Non assigné',
        players: poolPlayers
          .sort((a, b) => b.points - a.points || b.matchesWon - a.matchesWon)
          .map((p) => ({
            id: p.playerId,
            name: p.playerName,
            avatar: p.playerAvatar,
            elo: p.currentElo,
            eloAtStart: p.eloAtStart,
            points: p.points,
            matchesPlayed: p.matchesPlayed,
            matchesWon: p.matchesWon,
          })),
      }));

    return NextResponse.json({
      leagueId,
      leagueName: league.name,
      poolCount: league.poolCount,
      poolsDrawn: league.poolsDrawn,
      totalParticipants: participants.length,
      pools,
    });
  } catch (error) {
    console.error('Error fetching pools:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des poules' },
      { status: 500 }
    );
  }
}
