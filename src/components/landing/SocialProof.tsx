'use client';

import { useEffect, useState } from 'react';
import { Users, Trophy, MapPin, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicStats {
  displayPlayers: number;
  displayMatches: number;
  displayClubs: number;
  matchesThisMonth: number;
}

interface SocialProofProps {
  className?: string;
  /** Layout variant */
  variant?: 'default' | 'compact' | 'large';
}

/**
 * SocialProof - Dynamic statistics display for landing page
 * 
 * Fetches live stats from /api/stats/public
 * Displays player count, match count, and club count
 * Sprint Février 2026 - Conversion Optimization
 */
export function SocialProof({ className, variant = 'default' }: SocialProofProps) {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats/public');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className={cn('flex flex-wrap justify-center gap-8 py-6', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: Users,
      value: stats.displayPlayers,
      label: 'joueurs actifs',
      color: 'text-blue-500',
    },
    {
      icon: Trophy,
      value: stats.displayMatches,
      label: 'matchs enregistrés',
      color: 'text-amber-500',
    },
    {
      icon: MapPin,
      value: stats.displayClubs,
      label: 'clubs',
      color: 'text-green-500',
    },
  ];

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap justify-center gap-4 text-sm', className)}>
        {statItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-muted-foreground">
            <item.icon className={cn('h-4 w-4', item.color)} />
            <span className="font-semibold text-foreground">{formatNumber(item.value)}+</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6', className)}>
        {statItems.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center p-6 rounded-xl bg-card border"
          >
            <item.icon className={cn('h-8 w-8 mb-3', item.color)} />
            <span className="text-3xl font-bold">{formatNumber(item.value)}+</span>
            <span className="text-sm text-muted-foreground mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-wrap justify-center gap-8 py-6', className)}>
      {statItems.map((item) => (
        <Stat
          key={item.label}
          icon={item.icon}
          value={item.value}
          label={item.label}
          color={item.color}
        />
      ))}
    </div>
  );
}

interface StatProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color?: string;
}

function Stat({ icon: Icon, value, label, color }: StatProps) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className={cn('h-5 w-5', color)} />
      <span className="font-bold text-foreground">{formatNumber(value)}+</span>
      <span>{label}</span>
    </div>
  );
}

/**
 * Format number for display
 * Adds K/M suffixes for large numbers
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Animated counter version of SocialProof
 * Numbers count up when they come into view
 */
export function SocialProofAnimated({ className }: SocialProofProps) {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats/public');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }

    fetchStats();
  }, []);

  useEffect(() => {
    // Simple visibility trigger after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!stats) return null;

  return (
    <div className={cn('flex flex-wrap justify-center gap-8 py-6', className)}>
      <AnimatedStat
        icon={Users}
        value={stats.displayPlayers}
        label="joueurs actifs"
        color="text-blue-500"
        animate={isVisible}
      />
      <AnimatedStat
        icon={Trophy}
        value={stats.displayMatches}
        label="matchs enregistrés"
        color="text-amber-500"
        animate={isVisible}
      />
      <AnimatedStat
        icon={MapPin}
        value={stats.displayClubs}
        label="clubs"
        color="text-green-500"
        animate={isVisible}
      />
    </div>
  );
}

interface AnimatedStatProps extends StatProps {
  animate?: boolean;
}

function AnimatedStat({ icon: Icon, value, label, color, animate }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!animate) return;

    let start = 0;
    const duration = 1500; // 1.5 seconds
    const increment = value / (duration / 16); // ~60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [animate, value]);

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className={cn('h-5 w-5', color)} />
      <span className="font-bold text-foreground tabular-nums">
        {formatNumber(animate ? displayValue : 0)}+
      </span>
      <span>{label}</span>
    </div>
  );
}

/**
 * Live activity indicator
 * Shows "X joueurs en ligne" or similar
 */
export function LiveActivity({ className }: { className?: string }) {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats/public');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }

    fetchStats();
  }, []);

  if (!stats || stats.matchesThisMonth === 0) return null;

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      'text-sm font-medium',
      className
    )}>
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <TrendingUp className="h-3.5 w-3.5" />
      <span>{stats.matchesThisMonth} matchs ce mois</span>
    </div>
  );
}
