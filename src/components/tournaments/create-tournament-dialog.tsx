'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { TournamentFormat } from '@/lib/tournaments/types';

interface CreateTournamentDialogProps {
  clubId: string;
  onSuccess?: () => void;
}

const FORMAT_OPTIONS: { value: TournamentFormat; label: string; description: string }[] = [
  { 
    value: 'single_elimination', 
    label: 'Elimination simple', 
    description: '1 defaite = elimine' 
  },
  { 
    value: 'double_elimination', 
    label: 'Double elimination', 
    description: '2 defaites pour etre elimine' 
  },
  { 
    value: 'consolation', 
    label: 'Avec consolante', 
    description: 'Bracket consolation pour les perdants du T1' 
  },
];

const SEEDING_OPTIONS = [
  { value: 'elo', label: 'Par ELO', description: 'Meilleurs ELO tetes de serie' },
  { value: 'random', label: 'Aleatoire', description: 'Tirage au sort' },
];

// Helper pour formater une date en YYYY-MM-DD
function formatDateForInput(date: Date): string {
  const isoString = date.toISOString().split('T')[0];
  return isoString || '';
}

export function CreateTournamentDialog({ clubId, onSuccess }: CreateTournamentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('single_elimination');
  const [seedingMethod, setSeedingMethod] = useState('elo');
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [minParticipants, setMinParticipants] = useState(4);
  
  // Dates par defaut
  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  const [registrationStart, setRegistrationStart] = useState(formatDateForInput(today));
  const [registrationEnd, setRegistrationEnd] = useState(formatDateForInput(in7Days));
  const [startDate, setStartDate] = useState(formatDateForInput(in14Days));
  
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(true);
  const [eloRangeEnabled, setEloRangeEnabled] = useState(false);
  const [eloRangeMin, setEloRangeMin] = useState(1000);
  const [eloRangeMax, setEloRangeMax] = useState(1600);
  const [isPaid, setIsPaid] = useState(false);
  const [entryFee, setEntryFee] = useState(15); // Prix en euros

  const resetForm = () => {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    setName('');
    setDescription('');
    setFormat('single_elimination');
    setSeedingMethod('elo');
    setMaxParticipants(16);
    setMinParticipants(4);
    setRegistrationStart(formatDateForInput(now));
    setRegistrationEnd(formatDateForInput(in7));
    setStartDate(formatDateForInput(in14));
    setThirdPlaceMatch(true);
    setEloRangeEnabled(false);
    setEloRangeMin(1000);
    setEloRangeMax(1600);
    setIsPaid(false);
    setEntryFee(15);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Le nom du tournoi est requis');
      return;
    }
    
    if (!registrationStart || !registrationEnd || !startDate) {
      setError('Toutes les dates sont requises');
      return;
    }

    const regStartDate = new Date(registrationStart);
    const regEndDate = new Date(registrationEnd);
    const tournamentStartDate = new Date(startDate);

    if (regEndDate <= regStartDate) {
      setError('La fin des inscriptions doit etre apres le debut');
      return;
    }

    if (tournamentStartDate <= regEndDate) {
      setError('La date de debut doit etre apres la fin des inscriptions');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          name: name.trim(),
          description: description.trim() || null,
          format,
          seedingMethod,
          maxParticipants,
          minParticipants,
          registrationStart: regStartDate.toISOString(),
          registrationEnd: regEndDate.toISOString(),
          startDate: tournamentStartDate.toISOString(),
          thirdPlaceMatch,
          eloRangeMin: eloRangeEnabled ? eloRangeMin : null,
          eloRangeMax: eloRangeEnabled ? eloRangeMax : null,
          entryFee: isPaid ? entryFee * 100 : 0, // Convertir en centimes
          currency: 'EUR',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la creation');
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Creer un tournoi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            Nouveau tournoi
          </DialogTitle>
          <DialogDescription>
            Creez un tournoi a elimination directe pour votre club
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-md">
              {error}
            </div>
          )}

          {/* Nom et description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du tournoi *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Tournoi de Printemps 2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle du tournoi..."
                rows={2}
              />
            </div>
          </div>

          {/* Format et Seeding */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as TournamentFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seeding</Label>
              <Select value={seedingMethod} onValueChange={setSeedingMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEEDING_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nombre de participants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minParticipants">Participants min</Label>
              <Select 
                value={minParticipants.toString()} 
                onValueChange={(v) => setMinParticipants(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 8].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} joueurs</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Participants max</Label>
              <Select 
                value={maxParticipants.toString()} 
                onValueChange={(v) => setMaxParticipants(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[8, 16, 32, 64].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} joueurs</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Dates</Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationStart" className="text-sm">Debut inscriptions</Label>
                <Input
                  id="registrationStart"
                  type="date"
                  value={registrationStart}
                  onChange={(e) => setRegistrationStart(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationEnd" className="text-sm">Fin inscriptions</Label>
                <Input
                  id="registrationEnd"
                  type="date"
                  value={registrationEnd}
                  onChange={(e) => setRegistrationEnd(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm">Debut tournoi</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Options</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="thirdPlace">Match pour la 3eme place</Label>
                <p className="text-sm text-muted-foreground">
                  Petite finale entre les perdants des demi-finales
                </p>
              </div>
              <Switch
                id="thirdPlace"
                checked={thirdPlaceMatch}
                onCheckedChange={setThirdPlaceMatch}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="eloRange">Restriction ELO</Label>
                <p className="text-sm text-muted-foreground">
                  Limiter les inscriptions a une fourchette ELO
                </p>
              </div>
              <Switch
                id="eloRange"
                checked={eloRangeEnabled}
                onCheckedChange={setEloRangeEnabled}
              />
            </div>

            {eloRangeEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-purple-200">
                <div className="space-y-2">
                  <Label>ELO minimum</Label>
                  <Input
                    type="number"
                    value={eloRangeMin}
                    onChange={(e) => setEloRangeMin(parseInt(e.target.value) || 0)}
                    min={0}
                    max={3000}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ELO maximum</Label>
                  <Input
                    type="number"
                    value={eloRangeMax}
                    onChange={(e) => setEloRangeMax(parseInt(e.target.value) || 0)}
                    min={0}
                    max={3000}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPaid">Inscription payante</Label>
                <p className="text-sm text-muted-foreground">
                  Les joueurs devront payer pour s&apos;inscrire
                </p>
              </div>
              <Switch
                id="isPaid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
              />
            </div>

            {isPaid && (
              <div className="pl-4 border-l-2 border-green-200">
                <div className="space-y-2">
                  <Label htmlFor="entryFee">Frais d&apos;inscription (EUR)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="entryFee"
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(parseInt(e.target.value) || 0)}
                      min={1}
                      max={500}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">EUR</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Le paiement sera effectue via Stripe lors de l&apos;inscription
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>Chargement...</>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  Creer le tournoi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
