'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Zap, Timer, Target } from 'lucide-react';
import { 
  FORMAT_COEFFICIENTS, 
  FORMAT_LABELS, 
  FORMAT_DESCRIPTIONS,
  FORMAT_DISPLAY_ORDER,
  type MatchFormat 
} from '@/lib/elo/format-coefficients';
import { cn } from '@/lib/utils';

interface MatchFormatSelectorProps {
  value: MatchFormat;
  onChange: (value: MatchFormat) => void;
  className?: string;
}

const FORMAT_ICONS: Record<MatchFormat, React.ReactNode> = {
  one_set: <Zap className="h-5 w-5" />,
  two_sets: <Clock className="h-5 w-5" />,
  two_sets_super_tb: <Target className="h-5 w-5" />,
  three_sets: <Trophy className="h-5 w-5" />,
  super_tiebreak: <Timer className="h-5 w-5" />,
};

const FORMAT_COLORS: Record<MatchFormat, string> = {
  one_set: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
  two_sets: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
  two_sets_super_tb: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  three_sets: 'border-green-500 bg-green-50 dark:bg-green-950/30',
  super_tiebreak: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30',
};

const FORMAT_BADGE_COLORS: Record<number, string> = {
  1.0: 'bg-green-600 hover:bg-green-700',
  0.85: 'bg-indigo-600 hover:bg-indigo-700',
  0.8: 'bg-blue-600 hover:bg-blue-700',
  0.5: 'bg-amber-600 hover:bg-amber-700',
  0.3: 'bg-purple-600 hover:bg-purple-700',
};

export function MatchFormatSelector({ value, onChange, className }: MatchFormatSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-base font-medium">Format du match</Label>
      <RadioGroup 
        value={value} 
        onValueChange={(v) => onChange(v as MatchFormat)} 
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {FORMAT_DISPLAY_ORDER.map((format) => {
          const isSelected = value === format;
          const coefficient = FORMAT_COEFFICIENTS[format];
          
          return (
            <div key={format} className="relative">
              <RadioGroupItem
                value={format}
                id={format}
                className="peer sr-only"
              />
              <Label
                htmlFor={format}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all min-h-[140px]',
                  'hover:bg-accent/50',
                  isSelected 
                    ? FORMAT_COLORS[format] + ' border-2' 
                    : 'border-muted bg-popover hover:border-muted-foreground/50'
                )}
              >
                <div className={cn(
                  'mb-2 rounded-full p-2',
                  isSelected ? 'bg-background' : 'bg-muted'
                )}>
                  {FORMAT_ICONS[format]}
                </div>
                <span className="font-medium text-center text-sm">{FORMAT_LABELS[format]}</span>
                <span className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                  {FORMAT_DESCRIPTIONS[format]}
                </span>
                <Badge 
                  variant={coefficient < 1 ? 'secondary' : 'default'}
                  className={cn(
                    'mt-2',
                    FORMAT_BADGE_COLORS[coefficient] || 'bg-gray-600'
                  )}
                >
                  Impact ELO : ×{coefficient}
                </Badge>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <span>💡</span>
        <span>Les matchs courts ont un impact réduit car ils sont statistiquement plus aléatoires.</span>
      </p>
    </div>
  );
}

/**
 * Version compacte pour les formulaires serrés
 */
export function MatchFormatSelectorCompact({ 
  value, 
  onChange,
  className 
}: MatchFormatSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">Format</Label>
      <RadioGroup 
        value={value} 
        onValueChange={(v) => onChange(v as MatchFormat)} 
        className="flex flex-wrap gap-2"
      >
        {FORMAT_DISPLAY_ORDER.map((format) => {
          const isSelected = value === format;
          const coefficient = FORMAT_COEFFICIENTS[format];
          
          return (
            <div key={format}>
              <RadioGroupItem
                value={format}
                id={`compact-${format}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`compact-${format}`}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all text-sm',
                  isSelected 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted hover:border-muted-foreground/50'
                )}
              >
                {FORMAT_ICONS[format]}
                <span>{FORMAT_LABELS[format]}</span>
                <Badge variant="outline" className="text-xs">
                  ×{coefficient}
                </Badge>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
