/**
 * Club Stats Service
 * Calcule toutes les statistiques pour le dashboard admin club
 * 
 * Métriques clés:
 * - KPIs généraux (membres, actifs, matchs, rétention)
 * - Alertes (inactifs, nouveaux sans match, signalements)
 * - Activité hebdomadaire
 * - Top joueurs et nouveaux membres
 */

import { db } from '@/lib/db';
import { players, matches, clubs, users } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc, count, isNull, or } from 'drizzle-orm';

// ============================================
// TYPES
// ============================================

export interface ClubStatsOverview {
  totalMembers: number;
  activeMembers30d: number;
  matchesThisMonth: number;
  matchesTrend: number; // pourcentage de variation vs mois dernier
  retentionM3: number; // % membres créés il y a 3+ mois encore actifs
}

export interface InactiveMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  lastMatchDate: string | null;
  daysSinceLastMatch: number | null;
  currentElo: number;
}

export interface NewMemberWithoutMatch {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  joinedAt: string;
}

export interface ClubAlerts {
  inactiveMembers: InactiveMember[];
  newWithoutMatch: NewMemberWithoutMatch[];
  pendingReports: number;
}

export interface TopActiveMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  matchCount: number;
}

export interface NewMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface WeeklyActivity {
  week: string; // "2026-W04"
  matches: number;
}

export interface ClubMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  currentElo: number;
  matchesPlayed: number;
  lastMatchDate: string | null;
  createdAt: string;
  status: 'active' | 'inactive' | 'new';
}

export interface ClubStatsResponse {
  overview: ClubStatsOverview;
  alerts: ClubAlerts;
  topActive: TopActiveMember[];
  newMembers: NewMember[];
  weeklyActivity: WeeklyActivity[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDateRanges() {
  const now = new Date();
  return {
    now,
    thirtyDaysAgo: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    fourteenDaysAgo: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    threeMonthsAgo: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    twelveWeeksAgo: new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000),
    startOfMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    startOfLastMonth: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    endOfLastMonth: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
  };
}

// ============================================
// MAIN STATS FUNCTION
// ============================================

export async function getClubStats(clubId: string): Promise<ClubStatsResponse> {
  const dates = getDateRanges();

  // Exécuter toutes les queries en parallèle pour optimiser
  const [
    totalMembersResult,
    activeMembersResult,
    matchesThisMonthResult,
    matchesLastMonthResult,
    retentionData,
    inactiveMembersResult,
    newWithoutMatchResult,
    topActiveResult,
    newMembersResult,
    weeklyActivityResult,
  ] = await Promise.all([
    // 1. Total members
    db
      .select({ count: count() })
      .from(players)
      .where(and(eq(players.clubId, clubId), eq(players.isActive, true))),

    // 2. Active members (match in last 30 days)
    db.execute(sql`
      SELECT COUNT(DISTINCT p.id)::int as count
      FROM players p
      INNER JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id)
      WHERE p.club_id = ${clubId}
        AND p.is_active = true
        AND m.played_at >= ${dates.thirtyDaysAgo}
        AND m.validated = true
    `),

    // 3. Matches this month
    db
      .select({ count: count() })
      .from(matches)
      .where(
        and(
          eq(matches.clubId, clubId),
          gte(matches.playedAt, dates.startOfMonth),
          eq(matches.validated, true)
        )
      ),

    // 4. Matches last month
    db
      .select({ count: count() })
      .from(matches)
      .where(
        and(
          eq(matches.clubId, clubId),
          gte(matches.playedAt, dates.startOfLastMonth),
          lte(matches.playedAt, dates.endOfLastMonth),
          eq(matches.validated, true)
        )
      ),

    // 5. Retention M3 data
    Promise.all([
      db
        .select({ count: count() })
        .from(players)
        .where(
          and(
            eq(players.clubId, clubId),
            eq(players.isActive, true),
            lte(players.createdAt, dates.threeMonthsAgo)
          )
        ),
      db.execute(sql`
        SELECT COUNT(DISTINCT p.id)::int as count
        FROM players p
        INNER JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id)
        WHERE p.club_id = ${clubId}
          AND p.is_active = true
          AND p.created_at <= ${dates.threeMonthsAgo}
          AND m.played_at >= ${dates.thirtyDaysAgo}
          AND m.validated = true
      `),
    ]),

    // 6. Inactive members (no match in 30+ days, limited to 10)
    db.execute(sql`
      WITH player_last_match AS (
        SELECT 
          p.id,
          p.full_name,
          p.avatar_url,
          u.email,
          p.current_elo,
          MAX(m.played_at) as last_match_date
        FROM players p
        LEFT JOIN users u ON u.id = p.id
        LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.validated = true
        WHERE p.club_id = ${clubId}
          AND p.is_active = true
        GROUP BY p.id, p.full_name, p.avatar_url, u.email, p.current_elo
      )
      SELECT 
        id,
        full_name as "fullName",
        avatar_url as "avatarUrl",
        email,
        current_elo as "currentElo",
        last_match_date as "lastMatchDate"
      FROM player_last_match
      WHERE last_match_date < ${dates.thirtyDaysAgo} OR last_match_date IS NULL
      ORDER BY last_match_date ASC NULLS FIRST
      LIMIT 10
    `),

    // 7. New members without match (joined < 14 days, 0 matches)
    db
      .select({
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        email: users.email,
        joinedAt: players.createdAt,
      })
      .from(players)
      .leftJoin(users, eq(users.id, players.id))
      .where(
        and(
          eq(players.clubId, clubId),
          eq(players.isActive, true),
          gte(players.createdAt, dates.fourteenDaysAgo),
          eq(players.matchesPlayed, 0)
        )
      )
      .orderBy(desc(players.createdAt))
      .limit(10),

    // 8. Top 5 active members this month
    db.execute(sql`
      SELECT 
        p.id,
        p.full_name as "fullName",
        p.avatar_url as "avatarUrl",
        COUNT(m.id)::int as "matchCount"
      FROM players p
      INNER JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id)
      WHERE p.club_id = ${clubId}
        AND p.is_active = true
        AND m.played_at >= ${dates.startOfMonth}
        AND m.validated = true
      GROUP BY p.id, p.full_name, p.avatar_url
      ORDER BY COUNT(m.id) DESC
      LIMIT 5
    `),

    // 9. New members this month
    db
      .select({
        id: players.id,
        fullName: players.fullName,
        avatarUrl: players.avatarUrl,
        joinedAt: players.createdAt,
      })
      .from(players)
      .where(
        and(
          eq(players.clubId, clubId),
          eq(players.isActive, true),
          gte(players.createdAt, dates.startOfMonth)
        )
      )
      .orderBy(desc(players.createdAt))
      .limit(5),

    // 10. Weekly activity (last 12 weeks)
    db.execute(sql`
      SELECT 
        TO_CHAR(played_at, 'IYYY-"W"IW') as week,
        COUNT(*)::int as matches
      FROM matches
      WHERE club_id = ${clubId}
        AND played_at >= ${dates.twelveWeeksAgo}
        AND validated = true
      GROUP BY TO_CHAR(played_at, 'IYYY-"W"IW')
      ORDER BY week ASC
    `),
  ]);

  // Extraire les valeurs
  const totalMembers = totalMembersResult[0]?.count ?? 0;
  const activeMembers30d = Number((activeMembersResult.rows[0] as { count: number })?.count ?? 0);
  const matchesThisMonth = matchesThisMonthResult[0]?.count ?? 0;
  const matchesLastMonth = matchesLastMonthResult[0]?.count ?? 0;

  // Calculer la tendance
  const matchesTrend = matchesLastMonth > 0
    ? Math.round(((matchesThisMonth - matchesLastMonth) / matchesLastMonth) * 100)
    : matchesThisMonth > 0 ? 100 : 0;

  // Calculer la rétention M3
  const [oldMembersResult, oldMembersActiveResult] = retentionData;
  const oldMembersCount = oldMembersResult[0]?.count ?? 0;
  const activeOldMembers = Number((oldMembersActiveResult.rows[0] as { count: number })?.count ?? 0);
  const retentionM3 = oldMembersCount > 0
    ? Math.round((activeOldMembers / oldMembersCount) * 100)
    : 100; // Si pas de membres anciens, 100% par défaut

  // Formater les membres inactifs avec le calcul des jours
  const inactiveMembers: InactiveMember[] = (inactiveMembersResult.rows as Array<{
    id: string;
    fullName: string;
    avatarUrl: string | null;
    email: string | null;
    currentElo: number;
    lastMatchDate: Date | null;
  }>).map((row) => ({
    id: row.id,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl,
    email: row.email,
    currentElo: row.currentElo,
    lastMatchDate: row.lastMatchDate?.toISOString() ?? null,
    daysSinceLastMatch: row.lastMatchDate
      ? Math.floor((dates.now.getTime() - new Date(row.lastMatchDate).getTime()) / (24 * 60 * 60 * 1000))
      : null,
  }));

  // Formater les nouveaux sans match
  const newWithoutMatch: NewMemberWithoutMatch[] = newWithoutMatchResult.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    avatarUrl: m.avatarUrl,
    email: m.email,
    joinedAt: m.joinedAt?.toISOString() ?? '',
  }));

  // Formater les top actifs
  const topActive: TopActiveMember[] = (topActiveResult.rows as Array<{
    id: string;
    fullName: string;
    avatarUrl: string | null;
    matchCount: number;
  }>).map((row) => ({
    id: row.id,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl,
    matchCount: row.matchCount,
  }));

  // Formater les nouveaux membres
  const newMembers: NewMember[] = newMembersResult.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    avatarUrl: m.avatarUrl,
    joinedAt: m.joinedAt?.toISOString() ?? '',
  }));

  // Formater l'activité hebdomadaire
  const weeklyActivity: WeeklyActivity[] = (weeklyActivityResult.rows as Array<{
    week: string;
    matches: number;
  }>).map((row) => ({
    week: row.week,
    matches: row.matches,
  }));

  return {
    overview: {
      totalMembers,
      activeMembers30d,
      matchesThisMonth,
      matchesTrend,
      retentionM3,
    },
    alerts: {
      inactiveMembers,
      newWithoutMatch,
      pendingReports: 0, // TODO: Implémenter quand la table player_reports sera utilisée
    },
    topActive,
    newMembers,
    weeklyActivity,
  };
}

// ============================================
// GET ALL MEMBERS FOR TABLE
// ============================================

export async function getClubMembers(clubId: string): Promise<ClubMember[]> {
  const dates = getDateRanges();

  const result = await db.execute(sql`
    WITH player_last_match AS (
      SELECT 
        p.id,
        MAX(m.played_at) as last_match_date
      FROM players p
      LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.validated = true
      WHERE p.club_id = ${clubId}
      GROUP BY p.id
    )
    SELECT 
      p.id,
      p.full_name as "fullName",
      p.avatar_url as "avatarUrl",
      u.email,
      p.current_elo as "currentElo",
      p.matches_played as "matchesPlayed",
      plm.last_match_date as "lastMatchDate",
      p.created_at as "createdAt"
    FROM players p
    LEFT JOIN users u ON u.id = p.id
    LEFT JOIN player_last_match plm ON plm.id = p.id
    WHERE p.club_id = ${clubId}
      AND p.is_active = true
    ORDER BY p.current_elo DESC
  `);

  return (result.rows as Array<{
    id: string;
    fullName: string;
    avatarUrl: string | null;
    email: string | null;
    currentElo: number;
    matchesPlayed: number;
    lastMatchDate: Date | null;
    createdAt: Date;
  }>).map((row) => {
    // Déterminer le statut
    let status: 'active' | 'inactive' | 'new' = 'active';
    
    if (row.createdAt && new Date(row.createdAt) > dates.fourteenDaysAgo && row.matchesPlayed === 0) {
      status = 'new';
    } else if (!row.lastMatchDate || new Date(row.lastMatchDate) < dates.thirtyDaysAgo) {
      status = 'inactive';
    }

    return {
      id: row.id,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      email: row.email,
      currentElo: row.currentElo,
      matchesPlayed: row.matchesPlayed,
      lastMatchDate: row.lastMatchDate?.toISOString() ?? null,
      createdAt: row.createdAt?.toISOString() ?? '',
      status,
    };
  });
}

// ============================================
// EXPORT CSV
// ============================================

export async function getClubMembersForExport(clubId: string): Promise<string> {
  const members = await getClubMembers(clubId);
  
  // Headers CSV
  const headers = ['Nom', 'Email', 'ELO', 'Matchs joués', 'Dernier match', 'Date inscription', 'Statut'];
  
  // Lignes CSV
  const rows = members.map((m) => {
    const statusLabel = m.status === 'active' ? 'Actif' : m.status === 'new' ? 'Nouveau' : 'Inactif';
    const lastMatch = m.lastMatchDate 
      ? new Date(m.lastMatchDate).toLocaleDateString('fr-FR')
      : 'Jamais';
    const createdAt = new Date(m.createdAt).toLocaleDateString('fr-FR');
    
    return [
      `"${m.fullName}"`,
      m.email || '',
      m.currentElo,
      m.matchesPlayed,
      lastMatch,
      createdAt,
      statusLabel,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
