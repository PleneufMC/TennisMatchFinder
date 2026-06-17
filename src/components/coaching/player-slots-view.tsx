'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, MapPin, Clock, Loader2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { OpenSlotDTO } from './types';
import { formatPrice } from './types';

function formatSlotDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PlayerSlotsView() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<OpenSlotDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch('/api/coaching/slots');
      if (!res.ok) throw new Error('Erreur lors du chargement des créneaux');
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleBook = async (slotId: string) => {
    setBookingId(slotId);
    try {
      const res = await fetch(`/api/coaching/slots/${slotId}/book`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la réservation');
      toast({
        title: 'Créneau réservé 🎾',
        description:
          'Le coach a été notifié. Le règlement du cours se fait en direct avec lui.',
      });
      await fetchSlots();
    } catch (err) {
      toast({
        title: 'Réservation impossible',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setBookingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-lg bg-muted/30 py-12 text-center">
        <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-medium">Aucun créneau de coaching disponible</h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Aucun coach n&apos;a publié de créneau pour le moment. Revenez bientôt !
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => {
        const price = formatPrice(slot.priceCents);
        return (
          <Card key={slot.id} className="flex flex-col">
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
              {/* Coach */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={slot.coach.avatarUrl ?? undefined} alt={slot.coach.fullName} />
                  <AvatarFallback>{initials(slot.coach.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{slot.coach.fullName}</p>
                  <p className="text-xs text-muted-foreground">Coach</p>
                </div>
                {price && (
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                    {price}
                  </Badge>
                )}
              </div>

              {/* Détails */}
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  <span className="capitalize">{formatSlotDate(slot.startTime)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  {slot.durationMinutes} min
                </p>
                {slot.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{slot.location}</span>
                  </p>
                )}
              </div>

              {slot.notes && (
                <p className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                  {slot.notes}
                </p>
              )}

              {price && (
                <p className="text-[11px] text-muted-foreground">
                  Tarif indicatif — réglé en direct avec le coach.
                </p>
              )}

              <Button
                className="mt-auto w-full"
                onClick={() => handleBook(slot.id)}
                disabled={bookingId === slot.id}
              >
                {bookingId === slot.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réservation…
                  </>
                ) : (
                  'Réserver ce créneau'
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
