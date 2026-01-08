'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trophy, TrendingUp } from 'lucide-react';
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

interface CreateBoxLeagueDialogProps {
  clubId: string;
  onSuccess?: () => void;
}

// Helper pour formater une date en YYYY-MM-DD
function formatDateForInput(date: Date): string {
  const isoString = date.toISOString().split('T')[0];
  return isoString || '';
}

export function CreateBoxLeagueDialog({ clubId, onSuccess }: CreateBoxLeagueDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [division, setDivision] = useState(1);
  const [minPlayers, setMinPlayers] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [promotionSpots, setPromotionSpots] = useState(2);
  const [relegationSpots, setRelegationSpots] = useState(1);
  
  // Dates par defaut
  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in45Days = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
  
  const [registrationDeadline, setRegistrationDeadline] = useState(formatDateForInput(in7Days));
  const [startDate, setStartDate] = useState(formatDateForInput(in14Days));
  const [endDate, setEndDate] = useState(formatDateForInput(in45Days));
  
  const [eloRangeEnabled, setEloRangeEnabled] = useState(false);
  const [eloRangeMin, setEloRangeMin] = useState(1000);
  const [eloRangeMax, setEloRangeMax] = useState(1400);

  const resetForm = () => {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const in45 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    
    setName('');
    setDescription('');
    setDivision(1);
    setMinPlayers(4);
    setMaxPlayers(6);
    setPromotionSpots(2);
    setRelegationSpots(1);
    setRegistrationDeadline(formatDateForInput(in7));
    setStartDate(formatDateForInput(in14));
    setEndDate(formatDateForInput(in45));
    setEloRangeEnabled(false);
    setEloRangeMin(1000);
    setEloRangeMax(1400);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Le nom de la Box League est requis');
      return;
    }
    
    if (!registrationDeadline || !startDate || !endDate) {
      setError('Toutes les dates sont requises');
      return;
    }

    const regDeadlineDate = new Date(registrationDeadline);
    const leagueStartDate = new Date(startDate);
    const leagueEndDate = new Date(endDate);

    if (leagueStartDate <= regDeadlineDate) {
      setError('La date de debut doit etre apres la fin des inscriptions');
      return;
    }

    if (leagueEndDate <= leagueStartDate) {
      setError('La date de fin doit etre apres la date de debut');
      return;
    }

    if (promotionSpots + relegationSpots >= maxPlayers) {
      setError('Le total promotion + relegation doit etre inferieur au nombre de joueurs');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/box-leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          name: name.trim(),
          description: description.trim() || null,
          division,
          minPlayers,
          maxPlayers,
          promotionSpots,
          relegationSpots,
          registrationDeadline: regDeadlineDate.toISOString(),
          startDate: leagueStartDate.toISOString(),
          endDate: leagueEndDate.toISOString(),
          eloRangeMin: eloRangeEnabled ? eloRangeMin : null,
          eloRangeMax: eloRangeEnabled ? eloRangeMax : null,
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
          Creer une Box League
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Nouvelle Box League
          </DialogTitle>
          <DialogDescription>
            Creez une competition mensuelle avec poules par niveau
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
              <Label htmlFor="name">Nom de la Box League *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Box League Fevrier 2026 - Division 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle..."
                rows={2}
              />
            </div>
          </div>

          {/* Division */}
          <div className="space-y-2">
            <Label>Division</Label>
            <Select value={division.toString()} onValueChange={(v) => setDivision(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(d => (
                  <SelectItem key={d} value={d.toString()}>
                    Division {d} {d === 1 ? '(Elite)' : d === 2 ? '(Avance)' : d === 3 ? '(Intermediaire)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre de joueurs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Joueurs minimum</Label>
              <Select 
                value={minPlayers.toString()} 
                onValueChange={(v) => setMinPlayers(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} joueurs</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Joueurs maximum</Label>
              <Select 
                value={maxPlayers.toString()} 
                onValueChange={(v) => setMaxPlayers(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 5, 6, 7, 8].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} joueurs</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Promotion / Relegation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Places de promotion
              </Label>
              <Select 
                value={promotionSpots.toString()} 
                onValueChange={(v) => setPromotionSpots(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3].map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n === 0 ? 'Aucune' : `Top ${n}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Les {promotionSpots} premiers montent en division superieure
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                Places de relegation
              </Label>
              <Select 
                value={relegationSpots.toString()} 
                onValueChange={(v) => setRelegationSpots(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3].map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n === 0 ? 'Aucune' : `Dernier${n > 1 ? 's ' + n : ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Les {relegationSpots} derniers descendent en division inferieure
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Dates</Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline" className="text-sm">Fin inscriptions</Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm">Debut Box League</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm">Fin Box League</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Options ELO */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Options</Label>
            
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
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-amber-200">
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
          </div>

          {/* Recap systeme de points */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              Systeme de points
            </h4>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                <div className="font-bold text-green-700">+3</div>
                <div className="text-xs text-muted-foreground">Victoire</div>
              </div>
              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="font-bold">+1</div>
                <div className="text-xs text-muted-foreground">Nul</div>
              </div>
              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="font-bold">0</div>
                <div className="text-xs text-muted-foreground">Defaite</div>
              </div>
              <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                <div className="font-bold text-red-700">-1</div>
                <div className="text-xs text-muted-foreground">Forfait</div>
              </div>
            </div>
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
                  Creer la Box League
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
