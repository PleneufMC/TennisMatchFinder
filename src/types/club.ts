import type { Tables } from './database';

/**
 * Types étendus pour les clubs
 */

// Type de base
export type Club = Tables<'clubs'>;

// Configuration ELO du club
export interface ClubEloConfig {
  kFactorNew: number;
  kFactorIntermediate: number;
  kFactorEstablished: number;
  kFactorHigh: number;
}

// Configuration du decay d'inactivité
export interface ClubInactivityDecayConfig {
  enabled: boolean;
  weeksBeforeDecay: number;
  decayPerWeek: number;
}

// Configuration du bot
export interface ClubBotSettings {
  name: string;
  autoPostResults: boolean;
  weeklyRecap: boolean;
}

// Settings complets du club
export interface ClubSettings {
  allowPublicRegistration: boolean;
  requireApproval: boolean;
  defaultElo: number;
  inactivityDecay: ClubInactivityDecayConfig;
  eloConfig: ClubEloConfig;
  botSettings?: ClubBotSettings;
}

// Club avec settings typés
export interface ClubWithTypedSettings extends Omit<Club, 'settings'> {
  settings: ClubSettings;
}

// Stats du club pour le dashboard admin
export interface ClubStats {
  totalPlayers: number;
  activePlayers: number; // Actifs dans les 30 derniers jours
  totalMatches: number;
  matchesThisWeek: number;
  matchesThisMonth: number;
  averageElo: number;
  topPlayer: {
    id: string;
    fullName: string;
    elo: number;
  } | null;
  mostActivePlayer: {
    id: string;
    fullName: string;
    matchesCount: number;
  } | null;
}

// Pour la création de club (admin système)
export interface CreateClubInput {
  name: string;
  slug: string;
  description?: string;
  contactEmail?: string;
  websiteUrl?: string;
  address?: string;
  settings?: Partial<ClubSettings>;
}

// Pour la mise à jour du club
export interface UpdateClubInput {
  name?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  contactEmail?: string;
  websiteUrl?: string;
  address?: string;
  settings?: Partial<ClubSettings>;
}
