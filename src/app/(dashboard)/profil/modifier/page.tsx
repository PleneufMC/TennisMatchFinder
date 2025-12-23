import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { getServerPlayer } from '@/lib/auth-helpers';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';

export const metadata: Metadata = {
  title: 'Modifier mon profil',
  description: 'Modifiez vos informations personnelles et préférences',
};

export default async function ModifierProfilPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier mon profil</h1>
        <p className="text-muted-foreground mt-1">
          Mettez à jour vos informations et préférences de jeu
        </p>
      </div>

      <ProfileEditForm player={player} />
    </div>
  );
}
