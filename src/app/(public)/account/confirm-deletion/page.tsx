'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function ConfirmDeletionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'confirm' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Token manquant ou invalide');
    } else {
      setStatus('confirm');
    }
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    
    setIsConfirming(true);
    
    try {
      const response = await fetch('/api/account/delete/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'confirm' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setStatus('error');
      setError('Erreur de connexion');
    } finally {
      setIsConfirming(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Compte supprimé</CardTitle>
            <CardDescription>
              Votre compte a été supprimé définitivement
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Toutes vos données personnelles ont été supprimées conformément au RGPD.
            </p>
            <p className="text-sm text-muted-foreground">
              Merci d&apos;avoir utilisé TennisMatchFinder. 🎾
            </p>
            <Button asChild className="w-full">
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>
              {error || 'Une erreur est survenue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Le lien est peut-être expiré ou déjà utilisé.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings">Retour aux paramètres</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status === 'confirm'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Supprimer définitivement ?</CardTitle>
          <CardDescription>
            Cette action est irréversible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Attention !</strong> En confirmant, vous supprimez immédiatement :
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1 list-disc list-inside">
              <li>Votre profil et données personnelles</li>
              <li>Votre historique de matchs et ELO</li>
              <li>Vos badges et récompenses</li>
              <li>Vos messages et publications</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression en cours...
                </>
              ) : (
                'Oui, supprimer mon compte'
              )}
            </Button>
            <Button
              variant="outline"
              asChild
              disabled={isConfirming}
              className="w-full"
            >
              <Link href="/settings">Non, annuler</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmDeletionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <ConfirmDeletionContent />
    </Suspense>
  );
}
