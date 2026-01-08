import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { db } from '@/lib/db';
import { clubs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez votre compte TennisMatchFinder et rejoignez la communauté',
};

export default async function RegisterPage() {
  // Récupérer le premier club actif comme club par défaut
  const [defaultClub] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.isActive, true))
    .limit(1);

  // Si un club existe, utiliser son slug
  if (defaultClub) {
    return <RegisterForm clubSlug={defaultClub.slug} clubName={defaultClub.name} />;
  }

  // Si aucun club n'existe, afficher un message d'erreur
  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold">Inscription non disponible</h1>
      <p className="text-muted-foreground">
        Aucun club n&apos;est actuellement disponible pour l&apos;inscription.
      </p>
    </div>
  );
}
