'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { OnboardingData } from '../OnboardingFlow';

interface AvailabilityStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const days = [
  { value: 'lundi', label: 'Lun', fullLabel: 'Lundi' },
  { value: 'mardi', label: 'Mar', fullLabel: 'Mardi' },
  { value: 'mercredi', label: 'Mer', fullLabel: 'Mercredi' },
  { value: 'jeudi', label: 'Jeu', fullLabel: 'Jeudi' },
  { value: 'vendredi', label: 'Ven', fullLabel: 'Vendredi' },
  { value: 'samedi', label: 'Sam', fullLabel: 'Samedi' },
  { value: 'dimanche', label: 'Dim', fullLabel: 'Dimanche' },
];

const timeSlots = [
  { value: 'matin', label: 'Matin', time: '8h-12h', emoji: '🌅' },
  { value: 'midi', label: 'Midi', time: '12h-14h', emoji: '☀️' },
  { value: 'après-midi', label: 'Après-midi', time: '14h-18h', emoji: '🌤️' },
  { value: 'soir', label: 'Soir', time: '18h-22h', emoji: '🌙' },
];

const gameTypes = [
  { value: 'simple', label: 'Simple', emoji: '👤', description: '1 vs 1' },
  { value: 'double', label: 'Double', emoji: '👥', description: '2 vs 2' },
];

export function AvailabilityStep({ data, updateData, onNext, onBack }: AvailabilityStepProps) {
  const toggleDay = (day: string) => {
    const current = data.availability.days;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    updateData({
      availability: { ...data.availability, days: updated }
    });
  };

  const toggleTimeSlot = (slot: string) => {
    const current = data.availability.timeSlots;
    const updated = current.includes(slot)
      ? current.filter(s => s !== slot)
      : [...current, slot];
    updateData({
      availability: { ...data.availability, timeSlots: updated }
    });
  };

  const toggleGameType = (type: string) => {
    const current = data.preferences.gameTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    // Ensure at least one type is selected
    if (updated.length > 0) {
      updateData({
        preferences: { ...data.preferences, gameTypes: updated }
      });
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Tes disponibilités
        </CardTitle>
        <CardDescription>
          Aide-nous à te suggérer des matchs aux bons moments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Days selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Jours disponibles
          </Label>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => (
              <motion.button
                key={day.value}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleDay(day.value)}
                className={`p-3 rounded-lg border-2 text-center transition-all hover:border-primary/50 ${
                  data.availability.days.includes(day.value)
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-muted hover:bg-muted/50'
                }`}
              >
                <span className="text-sm font-medium">{day.label}</span>
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Sélectionne les jours où tu es généralement disponible
          </p>
        </div>

        {/* Time slots */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Créneaux horaires préférés
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((slot, index) => (
              <motion.button
                key={slot.value}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => toggleTimeSlot(slot.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                  data.availability.timeSlots.includes(slot.value)
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{slot.emoji}</span>
                  <div>
                    <p className="font-medium">{slot.label}</p>
                    <p className="text-xs text-muted-foreground">{slot.time}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Game type preferences */}
        <div className="space-y-3">
          <Label>Type de jeu préféré</Label>
          <div className="grid grid-cols-2 gap-3">
            {gameTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleGameType(type.value)}
                className={`p-4 rounded-lg border-2 text-center transition-all hover:border-primary/50 ${
                  data.preferences.gameTypes.includes(type.value)
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:bg-muted/50'
                }`}
              >
                <span className="text-2xl">{type.emoji}</span>
                <p className="font-medium mt-1">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Skip hint */}
        <p className="text-xs text-muted-foreground text-center">
          💡 Ces préférences sont optionnelles et modifiables à tout moment dans ton profil
        </p>

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
