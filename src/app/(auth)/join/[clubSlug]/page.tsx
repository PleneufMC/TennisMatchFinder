import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { createClient } from '@/lib/supabase/server';

interface JoinPageProps {
  params: Promise<{
    clubSlug: string;
  }>;
}

export async function generateMetadata({ params }: JoinPageProps): Promise<Metadata> {
  const { clubSlug } = await params;
  const supabase = await createClient();
  
  const { data: club } = await supabase
    .from('clubs')
    .select('name')
    .eq('slug', clubSlug)
    .single() as { data: { name: string } | null };

  if (!club) {
    return { title: 'Club non trouvé' };
  }

  return {
    title: `Rejoindre ${club.name}`,
    description: `Inscrivez-vous et rejoignez ${club.name} sur TennisMatchFinder`,
  };
}

interface ClubData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default async function JoinClubPage({ params }: JoinPageProps) {
  const { clubSlug } = await params;
  const supabase = await createClient();

  // Vérifier que le club existe
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, slug, description')
    .eq('slug', clubSlug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    notFound();
  }

  const club = data as ClubData;

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
