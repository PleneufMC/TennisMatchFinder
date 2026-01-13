'use client';

import { motion } from 'framer-motion';
import { Rocket, ArrowLeft, CheckCircle, Loader2, Sparkles, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OnboardingData } from '../OnboardingFlow';

interface FirstMatchStepProps {
  data: OnboardingData;
  isSubmitting: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export function FirstMatchStep({ data, isSubmitting, onComplete, onBack }: FirstMatchStepProps) {
  // Calculate profile completeness
  const completeness = [
    data.fullName.length > 0,
    data.city.length > 0,
    data.selfAssessedLevel.length > 0,
    data.availability.days.length > 0,
    data.availability.timeSlots.length > 0,
  ].filter(Boolean).length;
  
  const completenessPercent = Math.round((completeness / 5) * 100);

  return (
    <Card>
      <CardHeader className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto mb-4"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <Rocket className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <CardTitle>Prêt à jouer ! 🎾</CardTitle>
        <CardDescription>
          Ton profil est configuré, il est temps de trouver ton premier adversaire
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-muted/50 space-y-3"
        >
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Récapitulatif de ton profil
          </h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nom</p>
              <p className="font-medium">{data.fullName || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ville</p>
              <p className="font-medium">{data.city || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Niveau</p>
              <p className="font-medium capitalize">{data.selfAssessedLevel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ELO de départ</p>
              <p className="font-medium">1200</p>
            </div>
          </div>

          {/* Availability summary */}
          <div>
            <p className="text-muted-foreground text-sm mb-1">Disponibilités</p>
            <div className="flex flex-wrap gap-1">
              {data.availability.days.length > 0 ? (
                data.availability.days.map(day => (
                  <Badge key={day} variant="secondary" className="text-xs capitalize">
                    {day}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">Non renseigné</span>
              )}
              {data.availability.timeSlots.length > 0 && (
                <>
                  <span className="text-muted-foreground mx-1">•</span>
                  {data.availability.timeSlots.map(slot => (
                    <Badge key={slot} variant="outline" className="text-xs capitalize">
                      {slot}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Completeness bar */}
          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Profil complété</span>
              <span className="font-medium">{completenessPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completenessPercent}%` }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
              />
            </div>
          </div>
        </motion.div>

        {/* What's next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h4 className="font-medium">Et maintenant ?</h4>
          <div className="space-y-2">
            {[
              { icon: Target, text: 'Trouve un adversaire de ton niveau', highlight: true },
              { icon: Trophy, text: 'Joue des matchs pour améliorer ton ELO' },
              { icon: Sparkles, text: 'Débloque des badges et grimpe au classement' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  item.highlight 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                    : 'bg-muted/30'
                }`}
              >
                <item.icon className={`h-5 w-5 ${item.highlight ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className={item.highlight ? 'font-medium text-green-800 dark:text-green-200' : 'text-sm'}>
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button 
            onClick={onComplete} 
            disabled={isSubmitting} 
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                C&apos;est parti !
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
