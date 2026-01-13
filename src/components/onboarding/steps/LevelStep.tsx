'use client';

import { motion } from 'framer-motion';
import { TrendingUp, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { OnboardingData } from '../OnboardingFlow';

interface LevelStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const levels = [
  {
    value: 'débutant',
    label: 'Débutant',
    emoji: '🌱',
    description: 'Je découvre le tennis ou je joue depuis peu',
    eloRange: '1000-1150',
    examples: 'Apprentissage des coups de base, échanges courts',
  },
  {
    value: 'intermédiaire',
    label: 'Intermédiaire',
    emoji: '🎾',
    description: 'Je maîtrise les coups de base et je joue régulièrement',
    eloRange: '1150-1350',
    examples: 'Bons échanges, service régulier, déplacements corrects',
  },
  {
    value: 'avancé',
    label: 'Avancé',
    emoji: '⭐',
    description: 'Je joue en compétition ou j\'ai un bon niveau technique',
    eloRange: '1350-1550',
    examples: 'Tactique développée, bonne régularité, variété de coups',
  },
  {
    value: 'expert',
    label: 'Expert',
    emoji: '🏆',
    description: 'Joueur confirmé, niveau compétition régional+',
    eloRange: '1550+',
    examples: 'Classement FFT, tournois, technique aboutie',
  },
];

export function LevelStep({ data, updateData, onNext, onBack }: LevelStepProps) {
  const selectedLevel = levels.find(l => l.value === data.selfAssessedLevel);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Ton niveau de jeu
        </CardTitle>
        <CardDescription>
          Auto-évaluation initiale — sera affinée par l&apos;ELO au fil des matchs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Pas de stress ! Ce niveau est <strong>temporaire</strong>. Notre système ELO ajustera 
            automatiquement ton classement réel après quelques matchs.
          </AlertDescription>
        </Alert>

        {/* Level selection */}
        <RadioGroup
          value={data.selfAssessedLevel}
          onValueChange={(value) => updateData({ selfAssessedLevel: value as OnboardingData['selfAssessedLevel'] })}
          className="space-y-3"
        >
          {levels.map((level, index) => (
            <motion.div
              key={level.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Label
                htmlFor={level.value}
                className={`flex cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                  data.selfAssessedLevel === level.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted'
                }`}
              >
                <RadioGroupItem value={level.value} id={level.value} className="sr-only" />
                <div className="flex items-start gap-4 w-full">
                  <span className="text-3xl">{level.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{level.label}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        ~{level.eloRange} ELO
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {level.description}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">
                      Ex: {level.examples}
                    </p>
                  </div>
                </div>
              </Label>
            </motion.div>
          ))}
        </RadioGroup>

        {/* Selected level confirmation */}
        {selectedLevel && (
          <motion.div
            key={selectedLevel.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800"
          >
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {selectedLevel.emoji} Tu démarreras avec un ELO d&apos;environ <strong>1200</strong> (milieu de la fourchette {selectedLevel.label.toLowerCase()}).
            </p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button onClick={onNext} className="flex-1">
            Continuer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
