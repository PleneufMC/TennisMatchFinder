'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/hooks/use-player';
import { TSAFooter } from '@/components/partners';
import { NpsSurveyTrigger } from '@/components/nps';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { player, isLoading, isAuthenticated } = usePlayer();
  const hasRedirected = useRef(false);
  const initialLoadComplete = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log('[Dashboard Layout] State:', { isLoading, isAuthenticated, hasPlayer: !!player });
  }, [isLoading, isAuthenticated, player]);

  // Handle redirections after render to avoid hydration issues
  // Only redirect after initial load is complete AND we're sure user is not authenticated
  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) {
      return;
    }

    // Mark initial load as complete
    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true;
      console.log('[Dashboard Layout] Initial load complete:', { isAuthenticated, hasPlayer: !!player });
    }

    // Only redirect once, and only after initial load
    if (hasRedirected.current) {
      return;
    }

    // Give a small delay to ensure session is fully loaded
    const timer = setTimeout(() => {
      if (hasRedirected.current) return;
      
      if (!isAuthenticated) {
        console.log('[Dashboard] Not authenticated after delay, redirecting to login');
        hasRedirected.current = true;
        router.push('/login');
      } else if (!player) {
        console.log('[Dashboard] Authenticated but no player after delay, redirecting to onboarding');
        hasRedirected.current = true;
        router.push('/onboarding');
      }
    }, 500); // 500ms delay to ensure session is loaded

    return () => clearTimeout(timer);
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

      {/* NPS Survey - vérifie et affiche si éligible */}
      <NpsSurveyTrigger />
    </div>
  );
}
