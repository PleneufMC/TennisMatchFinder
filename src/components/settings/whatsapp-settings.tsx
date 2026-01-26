'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Check, X, Loader2, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';

interface WhatsAppPreferences {
  whatsappNumber: string | null;
  whatsappOptIn: boolean;
  whatsappVerified: boolean;
  isConfigured: boolean;
}

export function WhatsAppSettings() {
  const [preferences, setPreferences] = useState<WhatsAppPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Charger les préférences au montage
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/players/whatsapp');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        if (data.whatsappNumber) {
          setPhoneNumber(data.whatsappNumber);
        }
      }
    } catch (error) {
      console.error('Error fetching WhatsApp preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Veuillez entrer votre numéro WhatsApp');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/players/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setPreferences({
          whatsappNumber: data.whatsappNumber,
          whatsappOptIn: true,
          whatsappVerified: true,
          isConfigured: true,
        });
        setShowInput(false);
        toast.success('WhatsApp activé ! Tu as dû recevoir un message de confirmation.');
      } else {
        toast.error(data.error || 'Impossible d\'activer WhatsApp');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/players/whatsapp', {
        method: 'DELETE',
      });

      if (response.ok) {
        setPreferences(prev => prev ? { ...prev, whatsappOptIn: false } : null);
        toast.success('WhatsApp désactivé. Tu ne recevras plus de notifications.');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (preferences?.whatsappNumber) {
        // Réactiver avec le numéro existant
        handleActivate();
      } else {
        // Afficher l'input pour entrer un numéro
        setShowInput(true);
      }
    } else {
      handleDeactivate();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Si WhatsApp n'est pas configuré côté serveur
  if (preferences && !preferences.isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp
          </CardTitle>
          <CardDescription>
            Recevez vos notifications importantes directement sur WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Les notifications WhatsApp seront bientôt disponibles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          WhatsApp
          {preferences?.whatsappOptIn && (
            <Badge variant="default" className="ml-2 bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Activé
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Recevez vos notifications importantes directement sur WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notifications WhatsApp</Label>
            <p className="text-sm text-muted-foreground">
              Box Leagues, rappels de matchs, résultats, badges...
            </p>
          </div>
          <Switch
            checked={preferences?.whatsappOptIn || false}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>

        {/* Input numéro (si activation en cours) */}
        {showInput && !preferences?.whatsappOptIn && (
          <div className="space-y-3 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-number" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Numéro WhatsApp
              </Label>
              <Input
                id="whatsapp-number"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Format international recommandé (ex: +33612345678)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleActivate}
                disabled={saving || !phoneNumber.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Activer WhatsApp
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInput(false)}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Numéro actuel (si activé) */}
        {preferences?.whatsappOptIn && preferences?.whatsappNumber && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-muted-foreground">Numéro enregistré</Label>
                <p className="text-sm font-mono">
                  +{preferences.whatsappNumber}
                </p>
              </div>
              {preferences.whatsappVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Vérifié
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            📱 Les notifications WhatsApp incluent : démarrage de Box League, 
            rappels de matchs à jouer, résultats enregistrés, nouveaux badges.
            Tu peux désactiver à tout moment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
