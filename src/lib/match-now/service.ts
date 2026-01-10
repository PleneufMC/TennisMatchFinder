/**
 * Service Match Now - Disponibilité instantanée
 * 
 * Permet aux joueurs de signaler qu'ils sont disponibles pour jouer
 * immédiatement et de voir qui d'autre est disponible.
 */

import { db } from '@/lib/db';
import { matchNowAvailability, matchNowResponses, players, notifications } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql, ne } from 'drizzle-orm';

// Durée par défaut de disponibilité (2 heures)
const DEFAULT_AVAILABILITY_DURATION_MS = 2 * 60 * 60 * 1000;

// Plage ELO par défaut pour les suggestions (±100)
const DEFAULT_ELO_RANGE = 100;

// ============================================
// TYPES
// ============================================

export interface MatchNowAvailability {
  id: string;
  playerId: string;
  clubId: string | null;
  availableUntil: Date;
  message: string | null;
  gameTypes: string[];
  eloMin: number | null;
  eloMax: number | null;
  searchMode: 'club' | 'proximity' | null;
  radiusKm: number | null;
  isActive: boolean;
  createdAt: Date;
  player?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
    city?: string | null;
  };
}

export interface MatchNowResponse {
  id: string;
  availabilityId: string;
  responderId: string;
  message: string | null;
  status: string;
  createdAt: Date;
  responder?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    currentElo: number;
  };
}

export interface CreateAvailabilityParams {
  playerId: string;
  clubId: string | null;
  durationMinutes?: number;
  message?: string;
  gameTypes?: string[];
  eloMin?: number;
  eloMax?: number;
  searchMode?: 'club' | 'proximity';
  radiusKm?: number;
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Crée une disponibilité "Match Now"
 */
export async function createMatchNowAvailability(
  params: CreateAvailabilityParams
): Promise<MatchNowAvailability> {
  const {
    playerId,
    clubId,
    durationMinutes = 120,
    message,
    gameTypes = ['simple'],
    eloMin,
    eloMax,
    searchMode = 'club',
    radiusKm = 20,
  } = params;

  // Désactiver les disponibilités précédentes du joueur
  await db
    .update(matchNowAvailability)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(matchNowAvailability.playerId, playerId),
      eq(matchNowAvailability.isActive, true)
    ));

  // Calculer la date de fin
  const availableUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

  // Créer la nouvelle disponibilité
  const [newAvailability] = await db
    .insert(matchNowAvailability)
    .values({
      playerId,
      clubId,
      availableUntil,
      message: message || null,
      gameTypes,
      eloMin: eloMin || null,
      eloMax: eloMax || null,
      searchMode,
      radiusKm: searchMode === 'proximity' ? radiusKm : null,
      isActive: true,
    })
    .returning();

  if (!newAvailability) {
    throw new Error('Erreur lors de la création de la disponibilité');
  }

  // Notifier les joueurs compatibles (seulement en mode club)
  if (searchMode === 'club' && clubId) {
    await notifyCompatiblePlayers(newAvailability.id, playerId, clubId);
  }
  // TODO: En mode proximité, notifier par géolocalisation

  return newAvailability as MatchNowAvailability;
}

/**
 * Annule une disponibilité
 */
export async function cancelMatchNowAvailability(
  availabilityId: string,
  playerId: string
): Promise<void> {
  await db
    .update(matchNowAvailability)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(matchNowAvailability.id, availabilityId),
      eq(matchNowAvailability.playerId, playerId)
    ));
}

/**
 * Récupère la disponibilité active d'un joueur
 */
export async function getActiveAvailability(
  playerId: string
): Promise<MatchNowAvailability | null> {
  const now = new Date();
  
  const result = await db
    .select()
    .from(matchNowAvailability)
    .where(and(
      eq(matchNowAvailability.playerId, playerId),
      eq(matchNowAvailability.isActive, true),
      gte(matchNowAvailability.availableUntil, now)
    ))
    .limit(1);

  return result[0] as MatchNowAvailability || null;
}

/**
 * Récupère les joueurs disponibles maintenant dans un club
 */
export async function getAvailablePlayers(
  clubId: string,
  currentPlayerId?: string,
  currentPlayerElo?: number
): Promise<MatchNowAvailability[]> {
  const now = new Date();

  // Construction de la requête de base
  let query = db
    .select({
      availability: matchNowAvailability,
      player: {
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      },
    })
    .from(matchNowAvailability)
    .innerJoin(players, eq(matchNowAvailability.playerId, players.id))
    .where(and(
      eq(matchNowAvailability.clubId, clubId),
      eq(matchNowAvailability.isActive, true),
      gte(matchNowAvailability.availableUntil, now),
      currentPlayerId ? ne(matchNowAvailability.playerId, currentPlayerId) : undefined
    ))
    .orderBy(desc(matchNowAvailability.createdAt));

  const results = await query;

  // Filtrer par ELO si le joueur actuel est fourni
  let filteredResults = results;
  if (currentPlayerElo !== undefined) {
    filteredResults = results.filter((r) => {
      const { eloMin, eloMax } = r.availability;
      // Vérifier si le joueur actuel est dans la plage ELO demandée
      if (eloMin !== null && currentPlayerElo < eloMin) return false;
      if (eloMax !== null && currentPlayerElo > eloMax) return false;
      return true;
    });
  }

  return filteredResults.map((r) => ({
    ...r.availability,
    player: r.player,
  })) as MatchNowAvailability[];
}

/**
 * Calcule la distance en km entre deux points GPS (formule de Haversine)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Récupère les joueurs disponibles par proximité géographique (cross-club)
 */
export async function getAvailablePlayersByProximity(
  currentPlayerId: string,
  currentPlayerElo: number,
  latitude: number,
  longitude: number,
  radiusKm: number = 20
): Promise<(MatchNowAvailability & { distance: number })[]> {
  const now = new Date();

  // Récupérer toutes les disponibilités actives avec coordonnées
  const results = await db
    .select({
      availability: matchNowAvailability,
      player: {
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
        city: players.city,
        latitude: players.latitude,
        longitude: players.longitude,
      },
    })
    .from(matchNowAvailability)
    .innerJoin(players, eq(matchNowAvailability.playerId, players.id))
    .where(and(
      eq(matchNowAvailability.isActive, true),
      gte(matchNowAvailability.availableUntil, now),
      ne(matchNowAvailability.playerId, currentPlayerId)
    ))
    .orderBy(desc(matchNowAvailability.createdAt));

  // Filtrer par distance et ELO
  const filteredResults = results
    .filter((r) => {
      // Vérifier les coordonnées GPS
      if (!r.player.latitude || !r.player.longitude) return false;
      
      // Calculer la distance
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(r.player.latitude),
        parseFloat(r.player.longitude)
      );
      
      // Vérifier si dans le rayon
      if (distance > radiusKm) return false;

      // Vérifier la compatibilité ELO
      const { eloMin, eloMax } = r.availability;
      if (eloMin !== null && currentPlayerElo < eloMin) return false;
      if (eloMax !== null && currentPlayerElo > eloMax) return false;

      return true;
    })
    .map((r) => ({
      ...r.availability,
      player: r.player,
      distance: calculateDistance(
        latitude,
        longitude,
        parseFloat(r.player.latitude!),
        parseFloat(r.player.longitude!)
      ),
    }))
    .sort((a, b) => a.distance - b.distance); // Trier par distance

  return filteredResults as (MatchNowAvailability & { distance: number })[];
}

/**
 * Répond à une disponibilité
 */
export async function respondToAvailability(
  availabilityId: string,
  responderId: string,
  message?: string
): Promise<MatchNowResponse> {
  // Vérifier que la disponibilité existe et est active
  const [availability] = await db
    .select()
    .from(matchNowAvailability)
    .where(and(
      eq(matchNowAvailability.id, availabilityId),
      eq(matchNowAvailability.isActive, true),
      gte(matchNowAvailability.availableUntil, new Date())
    ))
    .limit(1);

  if (!availability) {
    throw new Error('Disponibilité non trouvée ou expirée');
  }

  // Vérifier que le joueur ne répond pas à sa propre disponibilité
  if (availability.playerId === responderId) {
    throw new Error('Vous ne pouvez pas répondre à votre propre disponibilité');
  }

  // Créer la réponse
  const [response] = await db
    .insert(matchNowResponses)
    .values({
      availabilityId,
      responderId,
      message: message || null,
      status: 'pending',
    })
    .returning();

  if (!response) {
    throw new Error('Erreur lors de la création de la réponse');
  }

  // Notifier le joueur disponible
  const [responder] = await db
    .select({ fullName: players.fullName })
    .from(players)
    .where(eq(players.id, responderId))
    .limit(1);

  if (responder) {
    await db.insert(notifications).values({
      userId: availability.playerId,
      type: 'match_now_response',
      title: '🎾 Quelqu\'un veut jouer !',
      message: `${responder.fullName} répond à votre disponibilité Match Now`,
      link: '/match-now',
      data: { availabilityId, responderId },
    });
  }

  return response as MatchNowResponse;
}

/**
 * Accepte ou décline une réponse
 */
export async function handleResponse(
  responseId: string,
  ownerId: string,
  action: 'accept' | 'decline'
): Promise<void> {
  // Vérifier que la réponse appartient à une disponibilité du joueur
  const [response] = await db
    .select({
      response: matchNowResponses,
      availability: matchNowAvailability,
    })
    .from(matchNowResponses)
    .innerJoin(matchNowAvailability, eq(matchNowResponses.availabilityId, matchNowAvailability.id))
    .where(eq(matchNowResponses.id, responseId))
    .limit(1);

  if (!response || response.availability.playerId !== ownerId) {
    throw new Error('Réponse non trouvée ou non autorisée');
  }

  const newStatus = action === 'accept' ? 'accepted' : 'declined';
  
  await db
    .update(matchNowResponses)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(matchNowResponses.id, responseId));

  // Notifier le répondeur
  const [owner] = await db
    .select({ fullName: players.fullName })
    .from(players)
    .where(eq(players.id, ownerId))
    .limit(1);

  if (owner) {
    await db.insert(notifications).values({
      userId: response.response.responderId,
      type: action === 'accept' ? 'match_now_accepted' : 'match_now_declined',
      title: action === 'accept' ? '✅ Match confirmé !' : '❌ Réponse déclinée',
      message: action === 'accept'
        ? `${owner.fullName} a accepté de jouer avec vous !`
        : `${owner.fullName} a décliné votre demande`,
      link: '/match-now',
      data: { responseId },
    });
  }

  // Si accepté, désactiver la disponibilité
  if (action === 'accept') {
    await db
      .update(matchNowAvailability)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(matchNowAvailability.id, response.availability.id));
  }
}

/**
 * Récupère les réponses à une disponibilité
 */
export async function getResponsesForAvailability(
  availabilityId: string,
  ownerId: string
): Promise<MatchNowResponse[]> {
  // Vérifier que la disponibilité appartient au joueur
  const [availability] = await db
    .select()
    .from(matchNowAvailability)
    .where(and(
      eq(matchNowAvailability.id, availabilityId),
      eq(matchNowAvailability.playerId, ownerId)
    ))
    .limit(1);

  if (!availability) {
    throw new Error('Disponibilité non trouvée ou non autorisée');
  }

  const results = await db
    .select({
      response: matchNowResponses,
      responder: {
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        currentElo: players.currentElo,
      },
    })
    .from(matchNowResponses)
    .innerJoin(players, eq(matchNowResponses.responderId, players.id))
    .where(eq(matchNowResponses.availabilityId, availabilityId))
    .orderBy(desc(matchNowResponses.createdAt));

  return results.map((r) => ({
    ...r.response,
    responder: r.responder,
  })) as MatchNowResponse[];
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Nettoie les disponibilités expirées
 */
export async function cleanupExpiredAvailabilities(): Promise<number> {
  const result = await db
    .update(matchNowAvailability)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(matchNowAvailability.isActive, true),
      lte(matchNowAvailability.availableUntil, new Date())
    ));

  return result.rowCount || 0;
}

/**
 * Notifie les joueurs compatibles d'une nouvelle disponibilité
 */
async function notifyCompatiblePlayers(
  availabilityId: string,
  creatorId: string,
  clubId: string
): Promise<void> {
  // Récupérer l'ELO du créateur
  const [creator] = await db
    .select({ currentElo: players.currentElo, fullName: players.fullName })
    .from(players)
    .where(eq(players.id, creatorId))
    .limit(1);

  if (!creator) return;

  // Récupérer les joueurs du club avec un ELO proche (±100)
  const compatiblePlayers = await db
    .select({ id: players.id })
    .from(players)
    .where(and(
      eq(players.clubId, clubId),
      eq(players.isActive, true),
      ne(players.id, creatorId),
      gte(players.currentElo, creator.currentElo - DEFAULT_ELO_RANGE),
      lte(players.currentElo, creator.currentElo + DEFAULT_ELO_RANGE)
    ))
    .limit(20); // Limiter pour éviter trop de notifications

  // Créer les notifications
  const notificationValues = compatiblePlayers.map((p) => ({
    userId: p.id,
    type: 'match_now_available',
    title: '🎾 Match Now !',
    message: `${creator.fullName} cherche un partenaire maintenant !`,
    link: '/match-now',
    data: { availabilityId, creatorId },
  }));

  if (notificationValues.length > 0) {
    await db.insert(notifications).values(notificationValues);
  }
}

/**
 * Compte les joueurs disponibles dans un club
 */
export async function countAvailablePlayers(clubId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(matchNowAvailability)
    .where(and(
      eq(matchNowAvailability.clubId, clubId),
      eq(matchNowAvailability.isActive, true),
      gte(matchNowAvailability.availableUntil, new Date())
    ));

  return result[0]?.count || 0;
}
