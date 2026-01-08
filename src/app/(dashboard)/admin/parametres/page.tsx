'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

interface ClubSettings {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
  address: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
}

export default function ParametresPage() {
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  

  // Charger les paramètres
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/admin/club-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        toast.error('Impossible de charger les paramètres');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast]);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/club-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      toast.success('Les modifications ont été enregistrées');
    } catch (error) {
      toast.error('Impossible de sauvegarder les paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof ClubSettings, value: string) => {
    if (settings) {
      setSettings({ ...settings, [field]: value || null });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Impossible de charger les paramètres</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Paramètres du club
          </h1>
          <p className="text-muted-foreground">
            Configuration générale de {settings.name}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Sauvegarder
        </Button>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Les informations de base de votre club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du club</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Mon Club de Tennis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Identifiant (slug)</Label>
              <Input
                id="slug"
                value={settings.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                L&apos;identifiant ne peut pas être modifié
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Décrivez votre club en quelques mots..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
          <CardDescription>
            Comment contacter le club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de contact</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => updateField('contactEmail', e.target.value)}
                placeholder="contact@monclub.fr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Site web</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={settings.websiteUrl || ''}
                onChange={(e) => updateField('websiteUrl', e.target.value)}
                placeholder="https://www.monclub.fr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={settings.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 Rue du Tennis, 75000 Paris"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Personnalisation visuelle */}
      <Card>
        <CardHeader>
          <CardTitle>Personnalisation visuelle</CardTitle>
          <CardDescription>
            Logo et bannière du club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL du logo</Label>
              <Input
                id="logoUrl"
                type="url"
                value={settings.logoUrl || ''}
                onChange={(e) => updateField('logoUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerUrl">URL de la bannière</Label>
              <Input
                id="bannerUrl"
                type="url"
                value={settings.bannerUrl || ''}
                onChange={(e) => updateField('bannerUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Utilisez des URLs d&apos;images hébergées (Cloudinary, Imgur, etc.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
