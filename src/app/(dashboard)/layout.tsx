'use client';

import { useState } from 'react';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/hooks/use-player';
import { TSAFooter } from '@/components/partners';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { player, isLoading, error } = usePlayer();

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="hidden md:block w-64 border-r bg-card" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b bg-card" />
          <main className="flex-1 overflow-y-auto p-6">
            <DashboardSkeleton />
          </main>
        </div>
      </div>
    );
  }

  // Redirection si pas de profil player
  // Note: Si l'utilisateur est connecté mais n'a pas de profil player,
  // il doit compléter son profil via onboarding
  if (!player) {
    // Check if there's a session (user is logged in)
    // If logged in but no player, redirect to onboarding
    // This handles the case where user signed up via magic link directly
    redirect('/onboarding');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex">
        <Sidebar isAdmin={player.isAdmin} />
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          player={player}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
            <TSAFooter className="mt-12 mb-6" />
          </div>
        </main>
      </div>

      {/* Navigation mobile */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isAdmin={player.isAdmin}
      />
    </div>
  );
}
