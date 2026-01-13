'use client';

import { motion } from 'framer-motion';
import { Rocket, Trophy, Users, TrendingUp, ArrowRight, FastForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeStepProps {
  userName?: string;
  onNext: () => void;
  onSkip: () => void;
}

const features = [
  {
    icon: TrendingUp,
    title: 'ELO Transparent',
    description: 'Le seul système où tu vois exactement comment ton niveau est calculé',
    color: 'text-green-500',
  },
  {
    icon: Users,
    title: 'Matchmaking Intelligent',
    description: 'Trouve des adversaires adaptés à ton niveau en quelques secondes',
    color: 'text-blue-500',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'Badges, classements, défis... Progresse en t\'amusant',
    color: 'text-amber-500',
  },
];

export function WelcomeStep({ userName, onNext, onSkip }: WelcomeStepProps) {
  const displayName = userName?.split(' ')[0] || 'Champion';

  return (
    <div className="text-center space-y-8">
      {/* Hero section */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="text-6xl mb-4">🎾</div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
          Bienvenue {displayName} !
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Le <span className="font-semibold text-foreground">Strava du Tennis</span> t&apos;attend
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <feature.icon className={`h-10 w-10 mx-auto mb-3 ${feature.color}`} />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* USP Banner */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800"
      >
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          💡 <strong>Notre différence</strong> : Contrairement à Playtomic, notre rating ELO est 100% transparent. 
          Tu verras exactement pourquoi ton niveau change après chaque match !
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Button size="lg" onClick={onNext} className="group">
          C&apos;est parti !
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
        <Button variant="ghost" size="lg" onClick={onSkip} className="text-muted-foreground">
          <FastForward className="mr-2 h-4 w-4" />
          Passer l&apos;intro
        </Button>
      </motion.div>
    </div>
  );
}
