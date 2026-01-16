import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerPlayer } from '@/lib/auth-helpers';
import { SettingsContent } from '@/components/settings/settings-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your settings and preferences',
};

export default async function SettingsPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  return <SettingsContent />;
}
