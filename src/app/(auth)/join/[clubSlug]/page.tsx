import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { getClubBySlug } from '@/lib/db/queries';

interface JoinPageProps {
  params: Promise<{
    clubSlug: string;
  }>;
}

export async function generateMetadata({ params }: JoinPageProps): Promise<Metadata> {
  const { clubSlug } = await params;
  const club = await getClubBySlug(clubSlug);

  if (!club) {
    return { title: 'Club non trouvé' };
  }

  return {
    title: `Rejoindre ${club.name}`,
    description: `Inscrivez-vous et rejoignez ${club.name} sur TennisMatchFinder`,
  };
}

export default async function JoinClubPage({ params }: JoinPageProps) {
  const { clubSlug } = await params;

  // Vérifier que le club existe et est actif
  const club = await getClubBySlug(clubSlug);

  if (!club || !club.isActive) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Informations sur le club */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rejoindre {club.name}</h1>
        {club.description && (
          <p className="text-muted-foreground max-w-md mx-auto">
            {club.description}
          </p>
        )}
      </div>

      {/* Formulaire d'inscription */}
      <RegisterForm clubSlug={club.slug} clubName={club.name} />
    </div>
  );
}
