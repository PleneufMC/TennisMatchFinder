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

    // Calculer le nombre optimal de poules (s'adapte au nombre réel de participants)
    const optimalPoolCount = calculateOptimalPoolCount(
      participants.length,
      league.poolCount,
      league.playersPerPool
    );

    const poolCountChanged = optimalPoolCount !== league.poolCount;

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
      pool.map((participant) =>
        db.insert(notifications).values({
          userId: participant.playerId,
          type: 'box_league_started',
          title: `🏆 ${league.name} démarre !`,
          message: optimalPoolCount > 1
            ? `Tu es dans la Poule ${poolNumberToLetter(poolIndex + 1)}. ${pool.length} joueurs dans ta poule. C'est parti !`
            : `La compétition démarre avec ${participants.length} joueurs. C'est parti !`,
          link: `/box-leagues/${leagueId}`,
          data: {
            leagueId,
            poolNumber: poolIndex + 1,
            poolLetter: poolNumberToLetter(poolIndex + 1),
          },
        })
      )
    );

    await Promise.all(notificationPromises);

    // Construire le résultat
    const result = pools.map((pool, index) => ({
      poolNumber: index + 1,
      poolLetter: poolNumberToLetter(index + 1),
      players: pool.map((p) => ({
        id: p.playerId,
        name: p.playerName,
        elo: p.eloAtStart,
      })),
    }));

    // Message informatif si le nombre de poules a été adapté
    const adaptationMessage = poolCountChanged 
      ? ` (adapté de ${league.poolCount} à ${optimalPoolCount} poule(s) selon le nombre d'inscrits)`
      : '';

    return NextResponse.json({
      success: true,
      message: `Tirage effectué et compétition démarrée ! ${participants.length} joueurs répartis en ${optimalPoolCount} poule(s)${adaptationMessage}. ${matchesToCreate.length} matchs générés.`,
      pools: result,
      matchesGenerated: matchesToCreate.length,
      poolCountAdapted: poolCountChanged,
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
