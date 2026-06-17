'use client';

import { useState } from 'react';
import {
  CalendarClock,
  Plus,
  Loader2,
  MapPin,
  Clock,
  X,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { CoachSlotDTO } from './types';
import { formatPrice, SLOT_STATUS_LABELS } from './types';

interface CoachSlotsManagerProps {
  slots: CoachSlotDTO[];
  defaultPriceCents: number | null;
  onChanged: () => Promise<void> | void;
}

const STATUS_BADGE: Record<
  CoachSlotDTO['status'],
  'default' | 'secondary' | 'success' | 'warning' | 'info' | 'outline' | 'destructive'
> = {
  open: 'secondary',
  booked: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'destructive',
};

function formatSlotDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CoachSlotsManager({ slots, defaultPriceCents, onChanged }: CoachSlotsManagerProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Form state
  const [startTime, setStartTime] = useState('');
  const [priceEuros, setPriceEuros] = useState(
    defaultPriceCents != null ? String(defaultPriceCents / 100) : ''
  );
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!startTime) {
      toast({ title: 'Indiquez une date et une heure', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const priceCents = priceEuros.trim()
        ? Math.round(parseFloat(priceEuros.replace(',', '.')) * 100)
        : undefined;

      const res = await fetch('/api/coaching/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: new Date(startTime).toISOString(),
          priceCents,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');

      toast({ title: 'Créneau publié 🎾' });
      setDialogOpen(false);
      setStartTime('');
      setLocation('');
      setNotes('');
      await onChanged();
    } catch (err) {
      toast({
        title: 'Création impossible',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const runAction = async (slotId: string, url: string, body?: object, successMsg?: string) => {
    setActionId(slotId);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      if (successMsg) toast({ title: successMsg });
      await onChanged();
    } catch (err) {
      toast({
        title: 'Action impossible',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Mes créneaux
            </CardTitle>
            <CardDescription>Créneaux de 60 min. Publiez, suivez et clôturez vos cours.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau créneau
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publier un créneau</DialogTitle>
                <DialogDescription>
                  Durée fixe de 60 minutes. Le tarif est indicatif (paiement hors plateforme).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="slot-start">Date et heure</Label>
                  <Input
                    id="slot-start"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot-price">Tarif indicatif (€)</Label>
                  <Input
                    id="slot-price"
                    type="number"
                    min={0}
                    step="0.5"
                    placeholder="Ex : 35"
                    value={priceEuros}
                    onChange={(e) => setPriceEuros(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot-location">Lieu (optionnel)</Label>
                  <Input
                    id="slot-location"
                    placeholder="Ex : Court n°3, club…"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot-notes">Notes (optionnel)</Label>
                  <Textarea
                    id="slot-notes"
                    placeholder="Précisions sur le cours…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    maxLength={300}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publication…
                    </>
                  ) : (
                    'Publier le créneau'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {slots.length === 0 ? (
          <div className="rounded-lg bg-muted/30 py-10 text-center text-sm text-muted-foreground">
            Aucun créneau pour le moment. Cliquez sur « Nouveau créneau » pour en publier un.
          </div>
        ) : (
          <ul className="divide-y">
            {slots.map((slot) => {
              const price = formatPrice(slot.priceCents);
              const busy = actionId === slot.id;
              return (
                <li
                  key={slot.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center gap-2 font-medium capitalize">
                      <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {formatSlotDate(slot.startTime)}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {slot.durationMinutes} min
                      </span>
                      {price && <span>{price}</span>}
                      {slot.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {slot.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_BADGE[slot.status]}>
                      {SLOT_STATUS_LABELS[slot.status]}
                    </Badge>

                    {/* Actions selon le statut */}
                    {slot.status === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          runAction(
                            slot.id,
                            `/api/coaching/slots/${slot.id}/cancel`,
                            undefined,
                            'Créneau annulé'
                          )
                        }
                      >
                        <X className="mr-1 h-4 w-4" />
                        Annuler
                      </Button>
                    )}
                    {slot.status === 'booked' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            runAction(
                              slot.id,
                              `/api/coaching/slots/${slot.id}/status`,
                              { action: 'confirm' },
                              'Créneau confirmé'
                            )
                          }
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Confirmer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            runAction(
                              slot.id,
                              `/api/coaching/slots/${slot.id}/cancel`,
                              undefined,
                              'Créneau annulé'
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {slot.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          runAction(
                            slot.id,
                            `/api/coaching/slots/${slot.id}/status`,
                            { action: 'complete' },
                            'Cours marqué comme effectué'
                          )
                        }
                      >
                        <CheckCheck className="mr-1 h-4 w-4" />
                        Effectué
                      </Button>
                    )}
                    {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
