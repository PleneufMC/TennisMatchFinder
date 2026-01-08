/**
 * Service pour la gestion des Tournois à élimination directe
 */

import { db } from '@/lib/db';
import { 
  tournaments, 
  tournamentParticipants, 
  tournamentMatches,
  players 
} from '@/lib/db/schema';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';
import type {
  Tournament,
  TournamentParticipant,
  TournamentMatch,
  TournamentBracket,
  BracketRound,
  CreateTournamentParams,
  RegisterTournamentParams,
  RecordTournamentMatchResult,
  TournamentStatus,
} from './types';
import { calculateTotalRounds, calculateByes, getRoundName } from './types';

// ============================================
// CRUD Tournois
// ============================================

export async function createTournament(params: CreateTournamentParams): Promise<Tournament> {
  const [tournament] = await db
    .insert(tournaments)
    .values({
      clubId: params.clubId,
      name: params.name,
      description: params.description,
      format: params.format || 'single_elimination',
      maxParticipants: params.maxParticipants,
      minParticipants: params.minParticipants || 4,
      eloRangeMin: params.eloRangeMin,
      eloRangeMax: params.eloRangeMax,
      seedingMethod: params.seedingMethod || 'elo',
      registrationStart: params.registrationStart,
      registrationEnd: params.registrationEnd,
      startDate: params.startDate,
      endDate: params.endDate,
      setsToWin: params.setsToWin || 2,
      finalSetsToWin: params.finalSetsToWin || 2,
      thirdPlaceMatch: params.thirdPlaceMatch || false,
      status: 'draft',
      createdBy: params.createdBy,
    })
    .returning();

  if (!tournament) {
    throw new Error('Erreur lors de la création du tournoi');
  }

  return tournament as Tournament;
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id))
    .limit(1);

  return tournament ? (tournament as Tournament) : null;
}

export async function getTournamentsByClub(
  clubId: string,
  filters?: { status?: TournamentStatus }
): Promise<Tournament[]> {
  let query = db
    .select()
    .from(tournaments)
    .where(eq(tournaments.clubId, clubId));

  if (filters?.status) {
    query = db
      .select()
      .from(tournaments)
      .where(and(
        eq(tournaments.clubId, clubId),
        eq(tournaments.status, filters.status)
      ));
  }

  const results = await query.orderBy(desc(tournaments.startDate));
  return results as Tournament[];
}

export async function updateTournamentStatus(
  id: string,
  status: TournamentStatus
): Promise<Tournament | null> {
  const [updated] = await db
    .update(tournaments)
    .set({ status, updatedAt: new Date() })
    .where(eq(tournaments.id, id))
    .returning();

  return updated ? (updated as Tournament) : null;
}

// ============================================
// Gestion des participants
// ============================================

export async function registerParticipant(
  params: RegisterTournamentParams
): Promise<TournamentParticipant> {
  // Vérifier si déjà inscrit
  const existing = await db
    .select()
    .from(tournamentParticipants)
    .where(and(
      eq(tournamentParticipants.tournamentId, params.tournamentId),
      eq(tournamentParticipants.playerId, params.playerId)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Joueur déjà inscrit à ce tournoi');
  }

  // Vérifier le nombre de participants
  const tournament = await getTournamentById(params.tournamentId);
  if (!tournament) {
    throw new Error('Tournoi non trouvé');
  }

  const participantCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(tournamentParticipants)
    .where(and(
      eq(tournamentParticipants.tournamentId, params.tournamentId),
      eq(tournamentParticipants.isActive, true)
    ));

  const count = participantCount[0]?.count || 0;
  if (count >= tournament.maxParticipants) {
    throw new Error('Tournoi complet');
  }

  const [participant] = await db
    .insert(tournamentParticipants)
    .values({
      tournamentId: params.tournamentId,
      playerId: params.playerId,
      eloAtRegistration: params.currentElo,
    })
    .returning();

  if (!participant) {
    throw new Error('Erreur lors de l\'inscription');
  }

  return participant as TournamentParticipant;
}

export async function getParticipants(
  tournamentId: string
): Promise<TournamentParticipant[]> {
  const results = await db
    .select({
      participant: tournamentParticipants,
      player: {
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      },
    })
    .from(tournamentParticipants)
    .leftJoin(players, eq(tournamentParticipants.playerId, players.id))
    .where(and(
      eq(tournamentParticipants.tournamentId, tournamentId),
      eq(tournamentParticipants.isActive, true)
    ))
    .orderBy(desc(tournamentParticipants.eloAtRegistration));

  return results.map(r => ({
    ...r.participant,
    player: r.player,
  })) as TournamentParticipant[];
}

export async function withdrawParticipant(
  tournamentId: string,
  playerId: string,
  reason?: string
): Promise<void> {
  await db
    .update(tournamentParticipants)
    .set({
      isActive: false,
      withdrawReason: reason || 'Désistement',
    })
    .where(and(
      eq(tournamentParticipants.tournamentId, tournamentId),
      eq(tournamentParticipants.playerId, playerId)
    ));
}

// ============================================
// Génération du bracket (Seeding)
// ============================================

export async function generateBracket(tournamentId: string): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw new Error('Tournoi non trouvé');
  }

  const participants = await getParticipants(tournamentId);
  if (participants.length < tournament.minParticipants) {
    throw new Error(`Minimum ${tournament.minParticipants} participants requis`);
  }

  // Calculer la taille du bracket (puissance de 2)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
  const totalRounds = calculateTotalRounds(bracketSize);
  const byeCount = bracketSize - participants.length;

  // Assigner les seeds selon la méthode choisie
  let seededParticipants: TournamentParticipant[];
  if (tournament.seedingMethod === 'elo') {
    // Tri par ELO décroissant
    seededParticipants = [...participants].sort(
      (a, b) => b.eloAtRegistration - a.eloAtRegistration
    );
  } else {
    // Ordre aléatoire
    seededParticipants = [...participants].sort(() => Math.random() - 0.5);
  }

  // Mettre à jour les seeds des participants
  for (let i = 0; i < seededParticipants.length; i++) {
    const participant = seededParticipants[i];
    if (participant) {
      await db
        .update(tournamentParticipants)
        .set({ seed: i + 1 })
        .where(eq(tournamentParticipants.id, participant.id));
    }
  }

  // Générer le bracket avec placement optimisé des têtes de série
  const bracketPositions = generateSeedPositions(bracketSize);
  
  // Créer les matchs du premier tour
  const firstRoundMatches = bracketSize / 2;
  const matchesToCreate: Array<{
    tournamentId: string;
    round: number;
    position: number;
    bracketType: string;
    player1Id: string | null;
    player2Id: string | null;
    player1Seed: number | null;
    player2Seed: number | null;
    status: string;
    isBye: boolean;
  }> = [];

  for (let i = 0; i < firstRoundMatches; i++) {
    const pos1 = bracketPositions[i * 2];
    const pos2 = bracketPositions[i * 2 + 1];
    
    if (pos1 === undefined || pos2 === undefined) continue;
    
    const player1 = seededParticipants[pos1 - 1] || null;
    const player2 = seededParticipants[pos2 - 1] || null;
    
    const isBye = !player1 || !player2;
    
    matchesToCreate.push({
      tournamentId,
      round: 1,
      position: i + 1,
      bracketType: 'main',
      player1Id: player1?.playerId || null,
      player2Id: player2?.playerId || null,
      player1Seed: player1 ? pos1 : null,
      player2Seed: player2 ? pos2 : null,
      status: isBye ? 'bye' : 'pending',
      isBye,
    });
  }

  // Insérer les matchs du premier tour
  if (matchesToCreate.length > 0) {
    await db.insert(tournamentMatches).values(matchesToCreate);
  }

  // Créer les matchs des tours suivants (vides pour l'instant)
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    const emptyMatches = [];
    
    for (let pos = 1; pos <= matchesInRound; pos++) {
      emptyMatches.push({
        tournamentId,
        round,
        position: pos,
        bracketType: 'main',
        player1Id: null,
        player2Id: null,
        status: 'pending',
        isBye: false,
      });
    }
    
    if (emptyMatches.length > 0) {
      await db.insert(tournamentMatches).values(emptyMatches);
    }
  }

  // Petite finale si activée
  if (tournament.thirdPlaceMatch) {
    await db.insert(tournamentMatches).values({
      tournamentId,
      round: totalRounds,
      position: 2, // Position 2 du dernier round = petite finale
      bracketType: 'consolation',
      player1Id: null,
      player2Id: null,
      status: 'pending',
      isBye: false,
    });
  }

  // Lier les matchs entre eux (nextMatchId)
  await linkBracketMatches(tournamentId, totalRounds);

  // Traiter les BYEs automatiquement
  await processByes(tournamentId);

  // Mettre à jour le tournoi
  await db
    .update(tournaments)
    .set({
      status: 'active',
      currentRound: 1,
      totalRounds,
      updatedAt: new Date(),
    })
    .where(eq(tournaments.id, tournamentId));
}

// Génère les positions des seeds pour un bracket équilibré
function generateSeedPositions(bracketSize: number): number[] {
  if (bracketSize === 2) return [1, 2];
  
  const positions: number[] = [];
  const halfSize = bracketSize / 2;
  const upperHalf = generateSeedPositions(halfSize);
  
  for (let i = 0; i < halfSize; i++) {
    const upper = upperHalf[i];
    if (upper !== undefined) {
      positions.push(upper);
      positions.push(bracketSize + 1 - upper);
    }
  }
  
  return positions;
}

async function linkBracketMatches(tournamentId: string, totalRounds: number): Promise<void> {
  const allMatches = await db
    .select()
    .from(tournamentMatches)
    .where(and(
      eq(tournamentMatches.tournamentId, tournamentId),
      eq(tournamentMatches.bracketType, 'main')
    ))
    .orderBy(asc(tournamentMatches.round), asc(tournamentMatches.position));

  // Grouper par round
  const matchesByRound: Record<number, typeof allMatches> = {};
  for (const match of allMatches) {
    const roundMatches = matchesByRound[match.round];
    if (!roundMatches) {
      matchesByRound[match.round] = [match];
    } else {
      roundMatches.push(match);
    }
  }

  // Lier chaque match au suivant
  for (let round = 1; round < totalRounds; round++) {
    const currentRoundMatches = matchesByRound[round] || [];
    const nextRoundMatches = matchesByRound[round + 1] || [];

    for (let i = 0; i < currentRoundMatches.length; i++) {
      const currentMatch = currentRoundMatches[i];
      if (!currentMatch) continue;
      
      const nextMatchIndex = Math.floor(i / 2);
      const nextMatch = nextRoundMatches[nextMatchIndex];
      
      if (nextMatch) {
        await db
          .update(tournamentMatches)
          .set({ nextMatchId: nextMatch.id })
          .where(eq(tournamentMatches.id, currentMatch.id));
      }
    }
  }
}

async function processByes(tournamentId: string): Promise<void> {
  const byeMatches = await db
    .select()
    .from(tournamentMatches)
    .where(and(
      eq(tournamentMatches.tournamentId, tournamentId),
      eq(tournamentMatches.isBye, true),
      eq(tournamentMatches.status, 'bye')
    ));

  for (const match of byeMatches) {
    // Le joueur présent avance automatiquement
    const winnerId = match.player1Id || match.player2Id;
    
    if (winnerId && match.nextMatchId) {
      await db
        .update(tournamentMatches)
        .set({
          winnerId,
          status: 'completed',
          playedAt: new Date(),
        })
        .where(eq(tournamentMatches.id, match.id));

      // Placer le vainqueur dans le match suivant
      await advanceWinner(match.id, winnerId);
    }
  }
}

// ============================================
// Gestion des matchs
// ============================================

export async function getTournamentMatches(
  tournamentId: string
): Promise<TournamentMatch[]> {
  const results = await db
    .select({
      match: tournamentMatches,
      player1: {
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      },
    })
    .from(tournamentMatches)
    .leftJoin(players, eq(tournamentMatches.player1Id, players.id))
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(asc(tournamentMatches.round), asc(tournamentMatches.position));

  // Récupérer les infos player2 séparément
  const matchIds = results.map(r => r.match.id);
  const player2Map: Record<string, any> = {};
  
  if (matchIds.length > 0) {
    const player2Results = await db
      .select({
        matchId: tournamentMatches.id,
        player2: {
          id: players.id,
          fullName: players.fullName,
          avatarUrl: players.avatarUrl,
          currentElo: players.currentElo,
        },
      })
      .from(tournamentMatches)
      .leftJoin(players, eq(tournamentMatches.player2Id, players.id))
      .where(inArray(tournamentMatches.id, matchIds));

    for (const r of player2Results) {
      player2Map[r.matchId] = r.player2;
    }
  }

  return results.map(r => ({
    ...r.match,
    player1: r.player1,
    player2: player2Map[r.match.id],
  })) as TournamentMatch[];
}

export async function getTournamentBracket(
  tournamentId: string
): Promise<TournamentBracket | null> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) return null;

  const matches = await getTournamentMatches(tournamentId);
  
  // Grouper par round et bracketType
  const mainMatches = matches.filter(m => m.bracketType === 'main');
  const consolationMatches = matches.filter(m => m.bracketType === 'consolation');

  const bracketSize = tournament.maxParticipants;
  const totalRounds = tournament.totalRounds || calculateTotalRounds(bracketSize);

  // Construire les rounds
  const rounds: BracketRound[] = [];
  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches = mainMatches.filter(m => m.round === round);
    rounds.push({
      round,
      name: getRoundName(round, totalRounds, bracketSize),
      matches: roundMatches,
    });
  }

  // Rounds de consolation si présents
  let consolationRounds: BracketRound[] | undefined;
  if (consolationMatches.length > 0) {
    consolationRounds = [{
      round: totalRounds,
      name: 'Petite finale',
      matches: consolationMatches,
    }];
  }

  return {
    tournament,
    rounds,
    consolationRounds,
  };
}

export async function recordMatchResult(
  params: RecordTournamentMatchResult
): Promise<TournamentMatch | null> {
  const [match] = await db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, params.matchId))
    .limit(1);

  if (!match) {
    throw new Error('Match non trouvé');
  }

  if (match.status === 'completed') {
    throw new Error('Match déjà terminé');
  }

  // Vérifier que le vainqueur est bien un des joueurs
  if (params.winnerId !== match.player1Id && params.winnerId !== match.player2Id) {
    throw new Error('Le vainqueur doit être un des joueurs du match');
  }

  // Mettre à jour le match
  const [updated] = await db
    .update(tournamentMatches)
    .set({
      winnerId: params.winnerId,
      score: params.score,
      player1Sets: params.player1Sets,
      player2Sets: params.player2Sets,
      status: 'completed',
      playedAt: new Date(),
      mainMatchId: params.mainMatchId,
      updatedAt: new Date(),
    })
    .where(eq(tournamentMatches.id, params.matchId))
    .returning();

  if (!updated) {
    throw new Error('Erreur lors de la mise à jour du match');
  }

  // Faire avancer le vainqueur
  if (match.nextMatchId) {
    await advanceWinner(params.matchId, params.winnerId);
  }

  // Mettre à jour le perdant (eliminatedInRound)
  const loserId = params.winnerId === match.player1Id ? match.player2Id : match.player1Id;
  if (loserId) {
    await db
      .update(tournamentParticipants)
      .set({ eliminatedInRound: match.round })
      .where(and(
        eq(tournamentParticipants.tournamentId, match.tournamentId),
        eq(tournamentParticipants.playerId, loserId)
      ));

    // Si petite finale activée et c'est une demi-finale
    const tournament = await getTournamentById(match.tournamentId);
    if (tournament?.thirdPlaceMatch && match.round === (tournament.totalRounds || 1) - 1) {
      await addToThirdPlaceMatch(match.tournamentId, loserId);
    }
  }

  // Vérifier si le tournoi est terminé
  await checkTournamentCompletion(match.tournamentId);

  return updated as TournamentMatch;
}

async function advanceWinner(matchId: string, winnerId: string): Promise<void> {
  const [match] = await db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, matchId))
    .limit(1);

  if (!match || !match.nextMatchId) return;

  const [nextMatch] = await db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, match.nextMatchId))
    .limit(1);

  if (!nextMatch) return;

  // Déterminer si le vainqueur va en player1 ou player2
  // Basé sur la position dans le round précédent
  const isUpperBracket = match.position % 2 === 1;
  
  if (isUpperBracket) {
    await db
      .update(tournamentMatches)
      .set({ player1Id: winnerId, player1Seed: match.player1Id === winnerId ? match.player1Seed : match.player2Seed })
      .where(eq(tournamentMatches.id, match.nextMatchId));
  } else {
    await db
      .update(tournamentMatches)
      .set({ player2Id: winnerId, player2Seed: match.player1Id === winnerId ? match.player1Seed : match.player2Seed })
      .where(eq(tournamentMatches.id, match.nextMatchId));
  }
}

async function addToThirdPlaceMatch(
  tournamentId: string,
  loserId: string
): Promise<void> {
  const [thirdPlaceMatch] = await db
    .select()
    .from(tournamentMatches)
    .where(and(
      eq(tournamentMatches.tournamentId, tournamentId),
      eq(tournamentMatches.bracketType, 'consolation')
    ))
    .limit(1);

  if (!thirdPlaceMatch) return;

  // Ajouter le perdant à la petite finale
  if (!thirdPlaceMatch.player1Id) {
    await db
      .update(tournamentMatches)
      .set({ player1Id: loserId })
      .where(eq(tournamentMatches.id, thirdPlaceMatch.id));
  } else if (!thirdPlaceMatch.player2Id) {
    await db
      .update(tournamentMatches)
      .set({ player2Id: loserId })
      .where(eq(tournamentMatches.id, thirdPlaceMatch.id));
  }
}

async function checkTournamentCompletion(tournamentId: string): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament || tournament.status === 'completed') return;

  // Vérifier si la finale est terminée
  const [finale] = await db
    .select()
    .from(tournamentMatches)
    .where(and(
      eq(tournamentMatches.tournamentId, tournamentId),
      eq(tournamentMatches.bracketType, 'main'),
      eq(tournamentMatches.round, tournament.totalRounds || 1)
    ))
    .limit(1);

  if (!finale || finale.status !== 'completed') return;

  // Déterminer les classements
  const winnerId = finale.winnerId;
  const runnerUpId = finale.player1Id === winnerId ? finale.player2Id : finale.player1Id;

  let thirdPlaceId: string | null = null;
  if (tournament.thirdPlaceMatch) {
    const [thirdPlace] = await db
      .select()
      .from(tournamentMatches)
      .where(and(
        eq(tournamentMatches.tournamentId, tournamentId),
        eq(tournamentMatches.bracketType, 'consolation')
      ))
      .limit(1);

    if (thirdPlace?.winnerId) {
      thirdPlaceId = thirdPlace.winnerId;
    }
  }

  // Mettre à jour le tournoi
  await db
    .update(tournaments)
    .set({
      status: 'completed',
      winnerId,
      runnerUpId,
      thirdPlaceId,
      updatedAt: new Date(),
    })
    .where(eq(tournaments.id, tournamentId));

  // Mettre à jour les positions finales des participants
  if (winnerId) {
    await db
      .update(tournamentParticipants)
      .set({ finalPosition: 1 })
      .where(and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.playerId, winnerId)
      ));
  }

  if (runnerUpId) {
    await db
      .update(tournamentParticipants)
      .set({ finalPosition: 2 })
      .where(and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.playerId, runnerUpId)
      ));
  }

  if (thirdPlaceId) {
    await db
      .update(tournamentParticipants)
      .set({ finalPosition: 3 })
      .where(and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.playerId, thirdPlaceId)
      ));
  }
}
