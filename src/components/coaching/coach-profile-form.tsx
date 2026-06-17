'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { CoachProfileDTO } from './types';

interface CoachProfileFormProps {
  profile: CoachProfileDTO | null;
  onSaved: () => Promise<void> | void;
}

export function CoachProfileForm({ profile, onSaved }: CoachProfileFormProps) {
  const { toast } = useToast();
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [priceEuros, setPriceEuros] = useState(
    profile?.hourlyRateCents != null ? String(profile.hourlyRateCents / 100) : ''
  );
  const [specialties, setSpecialties] = useState((profile?.specialties ?? []).join(', '));
  const [isPublished, setIsPublished] = useState(profile?.isPublished ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const hourlyRateCents = priceEuros.trim()
        ? Math.round(parseFloat(priceEuros.replace(',', '.')) * 100)
        : null;

      if (priceEuros.trim() && (hourlyRateCents === null || Number.isNaN(hourlyRateCents))) {
        throw new Error('Tarif invalide');
      }

      const specialtiesArr = specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/coaching/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio.trim() || null,
          hourlyRateCents,
          specialties: specialtiesArr,
          isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'enregistrement');

      toast({ title: 'Profil enregistré ✅' });
      await onSaved();
    } catch (err) {
      toast({
        title: 'Enregistrement impossible',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="coach-bio">Présentation</Label>
        <Textarea
          id="coach-bio"
          placeholder="Décrivez votre approche, votre expérience, vos diplômes…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={1000}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="coach-price">Tarif indicatif du cours (€)</Label>
          <Input
            id="coach-price"
            type="number"
            min={0}
            step="0.5"
            placeholder="Ex : 35"
            value={priceEuros}
            onChange={(e) => setPriceEuros(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Affiché aux joueurs. Le paiement se règle en direct (hors plateforme).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="coach-specialties">Spécialités</Label>
          <Input
            id="coach-specialties"
            placeholder="Ex : service, revers, compétition"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Séparées par des virgules.</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="coach-published" className="font-medium">
            Profil visible par les joueurs
          </Label>
          <p className="text-xs text-muted-foreground">
            Activez pour apparaître dans la liste des coachs.
          </p>
        </div>
        <Switch id="coach-published" checked={isPublished} onCheckedChange={setIsPublished} />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement…
          </>
        ) : (
          'Enregistrer mon profil'
        )}
      </Button>
    </div>
  );
}
