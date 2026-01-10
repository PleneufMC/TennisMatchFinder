import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerPlayer } from '@/lib/auth-helpers';
import { Settings, Bell, Shield, Palette, Globe, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocationSettings } from '@/components/profile/location-settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Paramètres',
  description: 'Gérez vos paramètres et préférences',
};

export default async function SettingsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choisissez comment vous souhaitez être notifié
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les notifications importantes par email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Propositions de match</Label>
                <p className="text-sm text-muted-foreground">
                  Être notifié des nouvelles propositions de match
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Messages du chat</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications pour les nouveaux messages
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Résultats de match</Label>
                <p className="text-sm text-muted-foreground">
                  Être notifié quand un match doit être confirmé
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Confidentialité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Confidentialité
            </CardTitle>
            <CardDescription>
              Contrôlez la visibilité de vos informations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profil visible</Label>
                <p className="text-sm text-muted-foreground">
                  Les autres membres peuvent voir votre profil
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Afficher mon ELO</Label>
                <p className="text-sm text-muted-foreground">
                  Votre classement ELO est visible par les autres
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Historique des matchs public</Label>
                <p className="text-sm text-muted-foreground">
                  Vos matchs sont visibles dans le classement
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Géolocalisation */}
        <LocationSettings />

        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez l'apparence de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thème</Label>
                <p className="text-sm text-muted-foreground">
                  Utilisez le bouton soleil/lune dans l'en-tête pour changer de thème
                </p>
              </div>
              <Badge variant="secondary">Automatique</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Langue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Langue et région
            </CardTitle>
            <CardDescription>
              Paramètres de localisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Langue</Label>
                <p className="text-sm text-muted-foreground">
                  Langue de l'interface
                </p>
              </div>
              <Badge variant="secondary">Français 🇫🇷</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Format de date</Label>
                <p className="text-sm text-muted-foreground">
                  Format d'affichage des dates
                </p>
              </div>
              <Badge variant="secondary">JJ/MM/AAAA</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Zone dangereuse */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Zone dangereuse
            </CardTitle>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Supprimer mon compte</Label>
                <p className="text-sm text-muted-foreground">
                  Supprime définitivement votre compte et toutes vos données
                </p>
              </div>
              <Button variant="destructive" size="sm" disabled>
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      <p className="text-sm text-muted-foreground text-center">
        💡 Les modifications sont enregistrées automatiquement.
        <br />
        Certaines fonctionnalités sont en cours de développement.
      </p>
    </div>
  );
}
