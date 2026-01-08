'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, X, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCookieConsent, type CookiePreferences } from '@/hooks/use-cookie-consent';

export function CookieBanner() {
  const {
    showBanner,
    preferences,
    acceptAll,
    rejectNonEssential,
    saveCustomPreferences,
  } = useCookieConsent();

  const [showSettings, setShowSettings] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<CookiePreferences>(preferences);

  // Mettre à jour les préférences temporaires quand les vraies changent
  const handleOpenSettings = () => {
    setTempPreferences(preferences);
    setShowSettings(true);
  };

  const handleSaveSettings = () => {
    saveCustomPreferences(tempPreferences);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="mx-auto max-w-4xl">
              <div className="rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg p-4 md:p-6">
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Cookie className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        Nous respectons votre vie privée
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Nous utilisons des cookies pour améliorer votre expérience sur TennisMatchFinder.
                        Les cookies essentiels sont nécessaires au fonctionnement du site.
                        Vous pouvez personnaliser vos préférences ci-dessous.
                      </p>
                    </div>
                  </div>

                  {/* Cookie types summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 dark:text-green-400">
                        Essentiels (requis)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Fonctionnels
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <Cookie className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Analytiques
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        href="/cookies"
                        className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
                      >
                        Politique de cookies
                      </Link>
                      <span className="text-muted-foreground">•</span>
                      <Link
                        href="/privacy"
                        className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
                      >
                        Vie privée
                      </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenSettings}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Personnaliser
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={rejectNonEssential}
                      >
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        onClick={acceptAll}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Tout accepter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de personnalisation */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Préférences de cookies
            </DialogTitle>
            <DialogDescription>
              Gérez vos préférences de cookies. Les cookies essentiels ne peuvent pas être désactivés.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Cookies essentiels */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-green-500/5 border-green-500/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <Label className="font-medium">Cookies essentiels</Label>
                  <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                    Requis
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Nécessaires au fonctionnement du site : authentification, sécurité, préférences de session.
                </p>
                <p className="text-xs text-muted-foreground">
                  Exemples : next-auth.session-token, __stripe_mid
                </p>
              </div>
              <Switch checked disabled className="data-[state=checked]:bg-green-600" />
            </div>

            {/* Cookies fonctionnels */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <Label htmlFor="functional" className="font-medium">
                    Cookies fonctionnels
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Améliorent votre expérience : thème préféré, chat en temps réel.
                </p>
                <p className="text-xs text-muted-foreground">
                  Exemples : theme, pusher-*
                </p>
              </div>
              <Switch
                id="functional"
                checked={tempPreferences.functional}
                onCheckedChange={(checked) =>
                  setTempPreferences((prev) => ({ ...prev, functional: checked }))
                }
              />
            </div>

            {/* Cookies analytiques */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  <Label htmlFor="analytics" className="font-medium">
                    Cookies analytiques
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Nous aident à comprendre comment vous utilisez le site pour l'améliorer.
                </p>
                <p className="text-xs text-muted-foreground">
                  Note : Aucun cookie analytique tiers n'est actuellement utilisé.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={tempPreferences.analytics}
                onCheckedChange={(checked) =>
                  setTempPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSettings}>
              Enregistrer mes préférences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
