import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Suppression des données | TennisMatchFinder',
  description: 'Information sur la suppression de vos données personnelles',
};

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function DataDeletionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const confirmationCode = params.id;

  return (
    <div className="container max-w-2xl py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Suppression des données</CardTitle>
          <CardDescription>
            Conformité RGPD et politiques Meta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {confirmationCode ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Demande de suppression reçue
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Code de confirmation : <code className="font-mono bg-green-100 dark:bg-green-900 px-1 rounded">{confirmationCode}</code>
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Vos données seront supprimées dans un délai de 30 jours conformément à notre politique de confidentialité.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p>
                TennisMatchFinder respecte votre vie privée et se conforme au Règlement Général sur la Protection des Données (RGPD) 
                ainsi qu&apos;aux politiques des plateformes Meta (Facebook, WhatsApp, Instagram).
              </p>

              <h3 className="font-semibold text-lg mt-6">Comment supprimer vos données ?</h3>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                  <p>Connectez-vous à votre compte TennisMatchFinder</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                  <p>Allez dans <strong>Paramètres</strong></p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                  <p>Cliquez sur <strong>Supprimer mon compte</strong></p>
                </div>
              </div>

              <h3 className="font-semibold text-lg mt-6">Données supprimées</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Informations de profil (nom, email, photo)</li>
                <li>Numéro WhatsApp (si renseigné)</li>
                <li>Préférences et paramètres</li>
                <li>Historique des matchs (anonymisé)</li>
              </ul>

              <h3 className="font-semibold text-lg mt-6">Contact</h3>
              <p className="text-muted-foreground">
                Pour toute question concernant vos données personnelles, contactez-nous à :{' '}
                <a href="mailto:contact@tennismatchfinder.net" className="text-primary hover:underline">
                  contact@tennismatchfinder.net
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
