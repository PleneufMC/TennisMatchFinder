'use client';

import { Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  tier: 'free' | 'premium' | 'pro';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function PremiumBadge({
  tier,
  size = 'md',
  showIcon = true,
  className,
}: PremiumBadgeProps) {
  if (tier === 'free') return null;

  const Icon = tier === 'pro' ? Crown : Sparkles;
  const label = tier === 'pro' ? 'Pro' : 'Premium';
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-medium',
        tier === 'pro' 
          ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' 
          : 'bg-primary/10 text-primary hover:bg-primary/20',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn('mr-1', iconSizes[size])} />}
      {label}
    </Badge>
  );
}
