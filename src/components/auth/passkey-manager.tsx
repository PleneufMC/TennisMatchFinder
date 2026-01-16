'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Fingerprint, 
  Plus, 
  Trash2, 
  Loader2, 
  Smartphone,
  Shield,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslations } from '@/lib/i18n';

interface Passkey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  credentialBackedUp: boolean;
  deviceType: 'singleDevice' | 'multiDevice';
}

export function PasskeyManager() {
  const { t, locale } = useTranslations('settings.passkeys');
  const { t: tCommon } = useTranslations('common');
  const dateLocale = locale === 'fr' ? fr : enUS;

  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);

  const fetchPasskeys = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/passkey');
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data.passkeys);
      }
    } catch (error) {
      console.error('Error fetching passkeys:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsSupported(browserSupportsWebAuthn());
    fetchPasskeys();
  }, [fetchPasskeys]);

  const handleRegisterPasskey = async () => {
    if (!isSupported) {
      toast.error(locale === 'fr' 
        ? 'Votre navigateur ne supporte pas les Passkeys' 
        : 'Your browser does not support Passkeys');
      return;
    }

    setIsRegistering(true);

    try {
      // Step 1: Get registration options
      const optionsRes = await fetch('/api/auth/passkey/register');
      if (!optionsRes.ok) {
        throw new Error(locale === 'fr' 
          ? 'Erreur lors de la récupération des options' 
          : 'Error retrieving options');
      }
      const options = await optionsRes.json();

      // Step 2: Start WebAuthn registration (triggers biometric prompt)
      const regResponse = await startRegistration({ optionsJSON: options });

      // Step 3: Verify with server
      const verifyRes = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          response: regResponse,
          name: newPasskeyName || undefined,
        }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.error || (locale === 'fr' ? 'Échec de l\'enregistrement' : 'Registration failed'));
      }

      toast.success(locale === 'fr' ? 'Passkey ajoutée avec succès ! 🎉' : 'Passkey added successfully! 🎉');
      setNewPasskeyName('');
      setShowNameDialog(false);
      fetchPasskeys();
    } catch (error) {
      console.error('Passkey registration error:', error);
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.info(locale === 'fr' ? 'Enregistrement annulé' : 'Registration cancelled');
      } else if (error instanceof Error && error.name === 'InvalidStateError') {
        toast.error(locale === 'fr' ? 'Cette Passkey est déjà enregistrée' : 'This Passkey is already registered');
      } else {
        toast.error(
          error instanceof Error 
            ? error.message 
            : (locale === 'fr' ? 'Erreur lors de l\'enregistrement' : 'Registration error')
        );
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    try {
      const res = await fetch(`/api/auth/passkey?id=${passkeyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Deletion error');
      }

      toast.success(locale === 'fr' ? 'Passkey supprimée' : 'Passkey deleted');
      fetchPasskeys();
    } catch (error) {
      console.error('Error deleting passkey:', error);
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Deletion error');
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {locale === 'fr' 
              ? 'Votre navigateur ne supporte pas les Passkeys. Essayez avec un navigateur plus récent (Safari, Chrome, Edge).'
              : 'Your browser does not support Passkeys. Try with a newer browser (Safari, Chrome, Edge).'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info box */}
        <div className="rounded-lg bg-primary/10 p-4 text-sm">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-primary">{t('secureLogin')}</p>
              <p className="text-muted-foreground mt-1">
                {t('secureLoginDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Passkeys list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('noPasskeys')}</p>
            <p className="text-sm mt-1">
              {t('noPasskeysDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {passkeys.map((passkey) => (
              <div 
                key={passkey.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Fingerprint className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{passkey.name}</span>
                      {passkey.credentialBackedUp && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('backedUp')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('created')} {formatDistanceToNow(new Date(passkey.createdAt), { 
                          addSuffix: true, 
                          locale: dateLocale 
                        })}
                      </span>
                      {passkey.lastUsedAt && (
                        <span>
                          • {t('lastUsed')} {formatDistanceToNow(new Date(passkey.lastUsedAt), { 
                            addSuffix: true, 
                            locale: dateLocale 
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('deletePasskey')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deletePasskeyDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeletePasskey(passkey.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {tCommon('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}

        {/* Add passkey button */}
        <AlertDialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <AlertDialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={isRegistering}
            >
              {isRegistering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t('addPasskey')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('addPasskey')}</AlertDialogTitle>
              <AlertDialogDescription>
                {locale === 'fr'
                  ? 'Donnez un nom à cette Passkey pour l\'identifier facilement (ex: "iPhone de Pierre", "MacBook Pro")'
                  : 'Give this Passkey a name to identify it easily (e.g., "Pierre\'s iPhone", "MacBook Pro")'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="passkey-name">
                {locale === 'fr' ? 'Nom (optionnel)' : 'Name (optional)'}
              </Label>
              <Input
                id="passkey-name"
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                placeholder={locale === 'fr' ? 'Mon iPhone' : 'My iPhone'}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRegisterPasskey}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="mr-2 h-4 w-4" />
                )}
                {tCommon('confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
