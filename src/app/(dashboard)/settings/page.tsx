import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServerPlayer } from '@/lib/auth-helpers';
import { SettingsContent } from '@/components/settings/settings-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your settings and preferences',
};

export default async function SettingsPage() {
  const [player, session] = await Promise.all([
    getServerPlayer(),
    getServerSession(authOptions),
  ]);

  if (!player || !session?.user?.email) {
    redirect('/login');
  }

  return <SettingsContent userEmail={session.user.email} />;
}
