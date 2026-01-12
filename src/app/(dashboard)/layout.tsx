'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { player, isLoading, isAuthenticated } = usePlayer();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle redirections after render to avoid hydration issues
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in -> redirect to login
        console.log('[Dashboard] Not authenticated, redirecting to login');
        router.push('/login');
      } else if (!player) {
        // Logged in but no player profile -> redirect to onboarding
        console.log('[Dashboard] Authenticated but no player, redirecting to onboarding');
        router.push('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, player, router]);

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

  // Show skeleton while redirecting
  if (!isAuthenticated || !player) {
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
