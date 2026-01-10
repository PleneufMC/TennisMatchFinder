import type { Metadata } from 'next';
import { RegisterCityForm } from '@/components/auth/register-city-form';
import { getAllClubs } from '@/lib/db/queries';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inscription | TennisMatchFinder',
  description: 'Créez votre compte joueur et rejoignez la communauté tennis',
};

export default async function RegisterPage() {
  // Récupérer la liste des clubs actifs pour le formulaire
  const clubs = await getAllClubs();
  const activeClubs = clubs.filter(c => c.isActive);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Créer un compte</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Rejoignez la communauté TennisMatchFinder et trouvez des partenaires de jeu
        </p>
      </div>

      <RegisterCityForm clubs={activeClubs} />
    </div>
  );
}
