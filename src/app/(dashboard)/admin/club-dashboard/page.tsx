/**
 * Page: Club Admin Dashboard (B2B)
 * /admin/club-dashboard
 * 
 * Dashboard complet pour les administrateurs de club.
 * Permet de visualiser l'activité, identifier les membres à risque,
 * et justifier le ROI de la plateforme.
 */

import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getServerPlayer } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clubs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ClubAdminDashboard } from '@/components/club/admin';

export const metadata: Metadata = {
  title: 'Dashboard Club | Admin',
  description: 'Tableau de bord administrateur du club - KPIs, activité et gestion des membres',
};

export const dynamic = 'force-dynamic';

export default async function ClubDashboardPage() {
  const player = await getServerPlayer();

  if (!player) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est admin et a un club
  if (!player.isAdmin || !player.clubId) {
    redirect('/dashboard');
  }

  // Récupérer les infos du club
  const [club] = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      slug: clubs.slug,
    })
    .from(clubs)
    .where(eq(clubs.id, player.clubId))
    .limit(1);

  if (!club) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <ClubAdminDashboard 
        clubId={club.id} 
        clubName={club.name} 
        clubSlug={club.slug}
      />
    </div>
  );
}
