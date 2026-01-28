'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function CancelDeletionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Token manquant ou invalide');
      return;
    }

    // Annuler automatiquement la suppression
    const cancelDeletion = async () => {
      try {
        const response = await fetch('/api/account/delete/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'cancel' }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setError(data.error || 'Erreur lors de l\'annulation');
        }
      } catch (err) {
        setStatus('error');
        setError('Erreur de connexion');
      }
    };

    cancelDeletion();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-muted-foreground">Annulation en cours...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Suppression annulée !</CardTitle>
            <CardDescription>
              Votre compte est conservé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <p className="text-green-800 dark:text-green-200">
                La demande de suppression a été annulée avec succès.
                <br />
                Toutes vos données sont préservées.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Conseil de sécurité
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Si vous n&apos;êtes pas à l&apos;origine de cette demande, nous vous recommandons de changer votre mot de passe.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/dashboard">Accéder à mon compte</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings">Paramètres de sécurité</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status === 'error'
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
            Le lien est peut-être expiré, déjà utilisé, ou la demande a déjà été traitée.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/settings">Retour aux paramètres</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CancelDeletionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <CancelDeletionContent />
    </Suspense>
  );
}
