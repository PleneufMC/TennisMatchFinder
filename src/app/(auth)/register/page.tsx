import type { Metadata } from 'next';
import { RegisterCityForm } from '@/components/auth/register-city-form';
import { getAllClubs } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering - this page requires database data
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inscription | TennisMatchFinder',
  description: 'Créez votre compte joueur et rejoignez la communauté tennis',
};

interface RegisterPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { ref: referrerId } = await searchParams;
  
  // Récupérer la liste des clubs actifs pour le formulaire
  const clubs = await getAllClubs();
  const activeClubs = clubs.filter(c => c.isActive);

  // Si un parrain est spécifié, récupérer ses infos
  let referrerInfo: { id: string; fullName: string } | null = null;
  if (referrerId) {
    const [referrer] = await db
      .select({ id: players.id, fullName: players.fullName })
      .from(players)
      .where(eq(players.id, referrerId))
      .limit(1);
    
    if (referrer) {
      referrerInfo = referrer;
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Créer un compte</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {referrerInfo 
            ? `Rejoignez TennisMatchFinder grâce à l'invitation de ${referrerInfo.fullName}`
            : 'Rejoignez la communauté TennisMatchFinder et trouvez des partenaires de jeu'
          }
        </p>
      </div>

      <RegisterCityForm clubs={activeClubs} referrerId={referrerInfo?.id} />
    </div>
  );
}
