/**
 * Service Box Leagues - Compétitions mensuelles par niveau
 * 
 * Format:
 * - Poules de 4-6 joueurs par niveau ELO
 * - Durée: 1 mois
 * - Joueurs organisent leurs matchs eux-mêmes
 * - Promotion/relégation automatique
 * - Intégration ELO des résultats
 */

import { db } from '@/lib/db';
import { 
  boxLeagues, 
  boxLeagueParticipants, 
  boxLeagueMatches,
  players,
  notifications,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, asc, sql, ne, or } from 'drizzle-orm';
import type {
  BoxLeague,
  BoxLeagueParticipant,
  BoxLeagueMatch,
  BoxLeagueStanding,
  CreateBoxLeagueParams,
  RegisterParticipantParams,
  RecordMatchResultParams,
  BoxLeagueStatus,
} from './types';

// ============================================
// GESTION DES BOX LEAGUES
// ============================================

/**
 * Crée une nouvelle Box League
 */
export async function createBoxLeague(params: CreateBoxLeagueParams): Promise<BoxLeague> {
  const {
    clubId,
    name,
    description,
    startDate,
    endDate,
    registrationDeadline,
    minPlayers = 4,
    maxPlayers = 6,
    eloRangeMin,
    eloRangeMax,
    division = 1,
    matchesPerPlayer = 5,
    promotionSpots = 1,
    relegationSpots = 1,
    poolCount = 1,
    playersPerPool = 6,
    createdBy,
  } = params;

  const [league] = await db
    .insert(boxLeagues)
    .values({
      clubId,
      name,
      description: description || null,
      startDate,
      endDate,
      registrationDeadline,
      minPlayers,
      maxPlayers: poolCount > 1 ? poolCount * playersPerPool : maxPlayers,
      eloRangeMin: eloRangeMin || null,
      eloRangeMax: eloRangeMax || null,
      division,
      matchesPerPlayer,
      promotionSpots,
      relegationSpots,
      poolCount,
      playersPerPool,
      poolsDrawn: false,
      status: 'draft',
      createdBy,
    })
    .returning();

  if (!league) {
    throw new Error('Erreur lors de la création de la Box League');
  }

  return league as BoxLeague;
}

/**
 * Récupère une Box League par ID
 */
export async function getBoxLeagueById(leagueId: string): Promise<BoxLeague | null> {
  const [league] = await db
    .select()
    .from(boxLeagues)
    .where(eq(boxLeagues.id, leagueId))
    .limit(1);

  return league as BoxLeague || null;
}

/**
 * Récupère les Box Leagues d'un club avec le nombre de participants
 */
export async function getBoxLeaguesByClub(
  clubId: string,
  status?: BoxLeagueStatus,
  includeParticipants: boolean = false
): Promise<BoxLeague[]> {
  const whereCondition = status
    ? and(eq(boxLeagues.clubId, clubId), eq(boxLeagues.status, status))
    : eq(boxLeagues.clubId, clubId);

  const leagues = await db
    .select()
    .from(boxLeagues)
    .where(whereCondition)
    .orderBy(desc(boxLeagues.startDate));

  // Récupérer le nombre de participants pour chaque league
  const leaguesWithCount = await Promise.all(
    leagues.map(async (league) => {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(boxLeagueParticipants)
        .where(and(
          eq(boxLeagueParticipants.leagueId, league.id),
          eq(boxLeagueParticipants.isActive, true)
        ));

      // Optionnellement récupérer la liste des participants
      let participantsList: BoxLeague['participants'] = undefined;
      if (includeParticipants) {
        const participantsData = await db
          .select({
            id: players.id,
            fullName: players.fullName,
            avatarUrl: players.avatarUrl,
            currentElo: players.currentElo,
          })
          .from(boxLeagueParticipants)
          .innerJoin(players, eq(boxLeagueParticipants.playerId, players.id))
          .where(and(
            eq(boxLeagueParticipants.leagueId, league.id),
            eq(boxLeagueParticipants.isActive, true)
          ))
          .orderBy(desc(players.currentElo))
          .limit(10); // Limiter pour éviter de surcharger la réponse

        participantsList = participantsData;
      }

      return {
        ...league,
        participantCount: countResult?.count || 0,
        participants: participantsList,
      } as BoxLeague;
    })
  );

  return leaguesWithCount;
}

/**
 * Met à jour le statut d'une Box League
 */
export async function updateBoxLeagueStatus(
  leagueId: string,
  status: BoxLeagueStatus
): Promise<void> {
  await db
    .update(boxLeagues)
    .set({ status, updatedAt: new Date() })
    .where(eq(boxLeagues.id, leagueId));

  // Si la league passe en "active", générer les matchs
  if (status === 'active') {
    await generateLeagueMatches(leagueId);
  }

  // Si la league passe en "completed", calculer les classements finaux
  if (status === 'completed') {
    await finalizeLeagueStandings(leagueId);
  }
}

// ============================================
// GESTION DES PARTICIPANTS
// ============================================

/**
 * Inscrit un joueur à une Box League
 */
export async function registerParticipant(
  params: RegisterParticipantParams
): Promise<BoxLeagueParticipant> {
  const { leagueId, playerId, currentElo } = params;

  // Vérifier que la league accepte les inscriptions
  const league = await getBoxLeagueById(leagueId);
  if (!league) {
    throw new Error('Box League non trouvée');
  }

  if (league.status !== 'registration') {
    throw new Error('Les inscriptions ne sont pas ouvertes');
  }

  if (new Date() > league.registrationDeadline) {
    throw new Error('La date limite d\'inscription est dépassée');
  }

  // Vérifier l'éligibilité ELO
  if (league.eloRangeMin !== null && currentElo < league.eloRangeMin) {
    throw new Error(`ELO insuffisant (minimum: ${league.eloRangeMin})`);
  }
  if (league.eloRangeMax !== null && currentElo > league.eloRangeMax) {
    throw new Error(`ELO trop élevé (maximum: ${league.eloRangeMax})`);
  }

  // Vérifier que le joueur n'est pas déjà inscrit
  const [existing] = await db
    .select()
    .from(boxLeagueParticipants)
    .where(and(
      eq(boxLeagueParticipants.leagueId, leagueId),
      eq(boxLeagueParticipants.playerId, playerId)
    ))
    .limit(1);

  if (existing) {
    throw new Error('Vous êtes déjà inscrit à cette Box League');
  }

  // Vérifier le nombre max de participants
  const participantCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(boxLeagueParticipants)
    .where(and(
      eq(boxLeagueParticipants.leagueId, leagueId),
      eq(boxLeagueParticipants.isActive, true)
    ));

  if ((participantCount[0]?.count || 0) >= league.maxPlayers) {
    throw new Error('Cette Box League est complète');
  }

  // Inscrire le joueur
  const [participant] = await db
    .insert(boxLeagueParticipants)
    .values({
      leagueId,
      playerId,
      eloAtStart: currentElo,
    })
    .returning();

  if (!participant) {
    throw new Error('Erreur lors de l\'inscription');
  }

  return participant as BoxLeagueParticipant;
}

/**
 * Récupère les participants d'une Box League
 */
export async function getLeagueParticipants(
  leagueId: string
): Promise<BoxLeagueParticipant[]> {
  const results = await db
    .select({
      participant: boxLeagueParticipants,
      player: {
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      },
    })
    .from(boxLeagueParticipants)
    .innerJoin(players, eq(boxLeagueParticipants.playerId, players.id))
    .where(eq(boxLeagueParticipants.leagueId, leagueId))
    .orderBy(desc(boxLeagueParticipants.points), desc(boxLeagueParticipants.setsWon));

  return results.map((r) => ({
    ...r.participant,
    player: r.player,
  })) as BoxLeagueParticipant[];
}

/**
 * Récupère le classement d'une Box League
 */
export async function getLeagueStandings(leagueId: string): Promise<BoxLeagueStanding[]> {
  const participants = await getLeagueParticipants(leagueId);

  // Trier par: points > diff sets > diff games > ELO
  const sorted = participants.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiffSets = a.setsWon - a.setsLost;
    const bDiffSets = b.setsWon - b.setsLost;
    if (bDiffSets !== aDiffSets) return bDiffSets - aDiffSets;
    const aDiffGames = a.gamesWon - a.gamesLost;
    const bDiffGames = b.gamesWon - b.gamesLost;
    if (bDiffGames !== aDiffGames) return bDiffGames - aDiffGames;
    return b.eloAtStart - a.eloAtStart;
  });

  return sorted.map((participant, index) => ({
    rank: index + 1,
    participant,
    trend: 'stable' as const, // TODO: Implémenter le calcul de tendance
  }));
}

// ============================================
// GESTION DES MATCHS
// ============================================

/**
 * Génère tous les matchs d'une Box League (round-robin)
 */
export async function generateLeagueMatches(leagueId: string): Promise<void> {
  const league = await getBoxLeagueById(leagueId);
  if (!league) return;

  const participants = await getLeagueParticipants(leagueId);
  if (participants.length < 2) return;

  // Générer tous les matchs (round-robin)
  const matchesToCreate: Array<{
    leagueId: string;
    player1Id: string;
    player2Id: string;
    deadline: Date;
  }> = [];

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matchesToCreate.push({
        leagueId,
        player1Id: participants[i]!.playerId,
        player2Id: participants[j]!.playerId,
        deadline: league.endDate,
      });
    }
  }

  if (matchesToCreate.length > 0) {
    await db.insert(boxLeagueMatches).values(matchesToCreate);
  }

  // Notifier les participants
  for (const participant of participants) {
    await db.insert(notifications).values({
      userId: participant.playerId,
      type: 'box_league_started',
      title: '🏆 Box League démarrée !',
      message: `La ${league.name} a commencé. Organisez vos matchs avec les autres participants.`,
      link: `/box-leagues/${leagueId}`,
      data: { leagueId },
    });
  }
}

/**
 * Récupère les matchs d'une Box League
 */
export async function getLeagueMatches(
  leagueId: string,
  playerId?: string
): Promise<BoxLeagueMatch[]> {
  let whereClause = eq(boxLeagueMatches.leagueId, leagueId);
  
  if (playerId) {
    whereClause = and(
      whereClause,
      or(
        eq(boxLeagueMatches.player1Id, playerId),
        eq(boxLeagueMatches.player2Id, playerId)
      )
    )!;
  }

  const results = await db
    .select({
      match: boxLeagueMatches,
      player1: {
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      },
    })
    .from(boxLeagueMatches)
    .innerJoin(players, eq(boxLeagueMatches.player1Id, players.id))
    .where(whereClause)
    .orderBy(asc(boxLeagueMatches.status), desc(boxLeagueMatches.createdAt));

  // Récupérer les infos player2 séparément
  const matchesWithPlayers: BoxLeagueMatch[] = [];
  
  for (const result of results) {
    const [player2] = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      })
      .from(players)
      .where(eq(players.id, result.match.player2Id))
      .limit(1);

    matchesWithPlayers.push({
      ...result.match,
      player1: result.player1,
      player2: player2 || undefined,
    } as BoxLeagueMatch);
  }

  return matchesWithPlayers;
}

/**
 * Enregistre le résultat d'un match de Box League
 */
export async function recordMatchResult(
  params: RecordMatchResultParams
): Promise<void> {
  const {
    matchId,
    winnerId,
    score,
    player1Sets,
    player2Sets,
    player1Games,
    player2Games,
    mainMatchId,
    isForfeit,
    forfeitById,
  } = params;

  // Récupérer le match
  const [match] = await db
    .select()
    .from(boxLeagueMatches)
    .where(eq(boxLeagueMatches.id, matchId))
    .limit(1);

  if (!match) {
    throw new Error('Match non trouvé');
  }

  if (match.status !== 'scheduled') {
    throw new Error('Ce match a déjà un résultat');
  }

  // Vérifier que le gagnant est bien l'un des deux joueurs
  if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
    throw new Error('Le gagnant doit être l\'un des deux joueurs');
  }

  const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

  // Déterminer le statut du match
  const matchStatus = isForfeit ? 'forfeit' : 'completed';

  // Mettre à jour le match
  await db
    .update(boxLeagueMatches)
    .set({
      winnerId,
      score: isForfeit ? 'WO' : score,
      player1Sets,
      player2Sets,
      player1Games,
      player2Games,
      status: matchStatus,
      forfeitBy: forfeitById || null,
      playedAt: new Date(),
      mainMatchId: mainMatchId || null,
      updatedAt: new Date(),
    })
    .where(eq(boxLeagueMatches.id, matchId));

  // Récupérer la league pour les points
  const league = await getBoxLeagueById(match.leagueId);
  if (!league) return;

  // Déterminer les points selon le type de résultat
  const winnerPoints = isForfeit ? league.pointsWin : league.pointsWin;
  const loserPoints = isForfeit ? league.pointsForfeit : league.pointsLoss;

  // Mettre à jour les stats du gagnant
  await db
    .update(boxLeagueParticipants)
    .set({
      matchesPlayed: sql`${boxLeagueParticipants.matchesPlayed} + 1`,
      matchesWon: sql`${boxLeagueParticipants.matchesWon} + 1`,
      points: sql`${boxLeagueParticipants.points} + ${winnerPoints}`,
      setsWon: sql`${boxLeagueParticipants.setsWon} + ${winnerId === match.player1Id ? player1Sets : player2Sets}`,
      setsLost: sql`${boxLeagueParticipants.setsLost} + ${winnerId === match.player1Id ? player2Sets : player1Sets}`,
      gamesWon: sql`${boxLeagueParticipants.gamesWon} + ${winnerId === match.player1Id ? player1Games : player2Games}`,
      gamesLost: sql`${boxLeagueParticipants.gamesLost} + ${winnerId === match.player1Id ? player2Games : player1Games}`,
      updatedAt: new Date(),
    })
    .where(and(
      eq(boxLeagueParticipants.leagueId, match.leagueId),
      eq(boxLeagueParticipants.playerId, winnerId)
    ));

  // Mettre à jour les stats du perdant
  await db
    .update(boxLeagueParticipants)
    .set({
      matchesPlayed: sql`${boxLeagueParticipants.matchesPlayed} + 1`,
      matchesLost: sql`${boxLeagueParticipants.matchesLost} + 1`,
      points: sql`${boxLeagueParticipants.points} + ${loserPoints}`,
      setsWon: sql`${boxLeagueParticipants.setsWon} + ${loserId === match.player1Id ? player1Sets : player2Sets}`,
      setsLost: sql`${boxLeagueParticipants.setsLost} + ${loserId === match.player1Id ? player2Sets : player1Sets}`,
      gamesWon: sql`${boxLeagueParticipants.gamesWon} + ${loserId === match.player1Id ? player1Games : player2Games}`,
      gamesLost: sql`${boxLeagueParticipants.gamesLost} + ${loserId === match.player1Id ? player2Games : player1Games}`,
      updatedAt: new Date(),
    })
    .where(and(
      eq(boxLeagueParticipants.leagueId, match.leagueId),
      eq(boxLeagueParticipants.playerId, loserId)
    ));
}

/**
 * Finalise le classement d'une Box League
 */
async function finalizeLeagueStandings(leagueId: string): Promise<void> {
  const league = await getBoxLeagueById(leagueId);
  if (!league) return;

  const standings = await getLeagueStandings(leagueId);

  for (let i = 0; i < standings.length; i++) {
    const standing = standings[i];
    if (!standing) continue;

    const isPromoted = i < league.promotionSpots;
    const isRelegated = i >= standings.length - league.relegationSpots;

    await db
      .update(boxLeagueParticipants)
      .set({
        finalRank: standing.rank,
        isPromoted,
        isRelegated,
        updatedAt: new Date(),
      })
      .where(eq(boxLeagueParticipants.id, standing.participant.id));

    // Notification de fin
    const statusMessage = isPromoted
      ? '🎉 Félicitations ! Vous êtes promu en division supérieure !'
      : isRelegated
      ? '📉 Vous êtes relégué en division inférieure.'
      : `Classement final : ${standing.rank}${standing.rank === 1 ? 'er' : 'ème'}`;

    await db.insert(notifications).values({
      userId: standing.participant.playerId,
      type: 'box_league_completed',
      title: `🏆 ${league.name} terminée`,
      message: statusMessage,
      link: `/box-leagues/${leagueId}`,
      data: { leagueId, rank: standing.rank, isPromoted, isRelegated },
    });
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Vérifie si un joueur est inscrit à une Box League
 */
export async function isPlayerRegistered(
  leagueId: string,
  playerId: string
): Promise<boolean> {
  const [participant] = await db
    .select()
    .from(boxLeagueParticipants)
    .where(and(
      eq(boxLeagueParticipants.leagueId, leagueId),
      eq(boxLeagueParticipants.playerId, playerId),
      eq(boxLeagueParticipants.isActive, true)
    ))
    .limit(1);

  return !!participant;
}

/**
 * Récupère les Box Leagues actives pour un joueur avec le nombre de participants et leurs infos
 */
export async function getPlayerActiveLeagues(playerId: string): Promise<BoxLeague[]> {
  const participations = await db
    .select({ leagueId: boxLeagueParticipants.leagueId })
    .from(boxLeagueParticipants)
    .where(and(
      eq(boxLeagueParticipants.playerId, playerId),
      eq(boxLeagueParticipants.isActive, true)
    ));

  if (participations.length === 0) return [];

  const leagueIds = participations.map((p) => p.leagueId);
  
  const leagues = await db
    .select()
    .from(boxLeagues)
    .where(and(
      sql`${boxLeagues.id} IN ${leagueIds}`,
      or(eq(boxLeagues.status, 'active'), eq(boxLeagues.status, 'registration'))
    ))
    .orderBy(desc(boxLeagues.startDate));

  // Ajouter le nombre de participants ET la liste des participants pour chaque league
  const leaguesWithParticipants = await Promise.all(
    leagues.map(async (league) => {
      // Compter les participants
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(boxLeagueParticipants)
        .where(and(
          eq(boxLeagueParticipants.leagueId, league.id),
          eq(boxLeagueParticipants.isActive, true)
        ));

      // Récupérer la liste des participants avec leurs infos
      const participantsData = await db
        .select({
          id: players.id,
          fullName: players.fullName,
          avatarUrl: players.avatarUrl,
          currentElo: players.currentElo,
        })
        .from(boxLeagueParticipants)
        .innerJoin(players, eq(boxLeagueParticipants.playerId, players.id))
        .where(and(
          eq(boxLeagueParticipants.leagueId, league.id),
          eq(boxLeagueParticipants.isActive, true)
        ))
        .orderBy(desc(players.currentElo))
        .limit(10);

      return {
        ...league,
        participantCount: countResult?.count || 0,
        participants: participantsData,
      } as BoxLeague;
    })
  );

  return leaguesWithParticipants;
}
