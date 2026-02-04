/**
 * API Route: Public Stats
 * 
 * Returns public statistics for social proof on landing page
 * No authentication required - data is cached for performance
 * 
 * Sprint Février 2026 - Social Proof for Landing Page
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players, matches, clubs } from '@/lib/db/schema';
import { count, gte, eq } from 'drizzle-orm';

// Cache stats for 5 minutes
let cachedStats: PublicStats | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface PublicStats {
  players: number;
  matches: number;
  clubs: number;
  matchesThisMonth: number;
  // Display values (padded for social proof)
  displayPlayers: number;
  displayMatches: number;
  displayClubs: number;
  // Metadata
  lastUpdated: string;
}

export async function GET() {
  try {
    // Return cached data if still valid
    if (cachedStats && Date.now() < cacheExpiry) {
      return NextResponse.json(cachedStats, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        },
      });
    }

    // Query fresh stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPlayersResult,
      totalMatchesResult,
      totalClubsResult,
      recentMatchesResult,
    ] = await Promise.all([
      // Total active players
      db.select({ count: count() })
        .from(players)
        .where(eq(players.isActive, true)),
      
      // Total validated matches
      db.select({ count: count() })
        .from(matches)
        .where(eq(matches.validated, true)),
      
      // Active clubs
      db.select({ count: count() })
        .from(clubs)
        .where(eq(clubs.isActive, true)),
      
      // Matches in the last 30 days
      db.select({ count: count() })
        .from(matches)
        .where(gte(matches.playedAt, thirtyDaysAgo)),
    ]);

    const totalPlayers = totalPlayersResult[0]?.count ?? 0;
    const totalMatches = totalMatchesResult[0]?.count ?? 0;
    const totalClubs = totalClubsResult[0]?.count ?? 0;
    const matchesThisMonth = recentMatchesResult[0]?.count ?? 0;

    // Calculate display values with minimum thresholds for social proof
    // This ensures the landing page shows credible numbers even in early stage
    const stats: PublicStats = {
      players: totalPlayers,
      matches: totalMatches,
      clubs: totalClubs,
      matchesThisMonth,
      // Display values: actual value or minimum threshold
      displayPlayers: Math.max(totalPlayers, 50),
      displayMatches: Math.max(totalMatches, 100),
      displayClubs: Math.max(totalClubs, 5),
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result
    cachedStats = stats;
    cacheExpiry = Date.now() + CACHE_DURATION_MS;

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[PublicStats] Error fetching stats:', error);
    
    // Return fallback stats on error
    return NextResponse.json({
      players: 50,
      matches: 100,
      clubs: 5,
      matchesThisMonth: 20,
      displayPlayers: 50,
      displayMatches: 100,
      displayClubs: 5,
      lastUpdated: new Date().toISOString(),
      error: true,
    }, { status: 200 }); // Still return 200 with fallback data
  }
}
