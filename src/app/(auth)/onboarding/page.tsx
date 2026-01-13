'use client';

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { OnboardingFlow } from '@/components/onboarding';

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Redirect if already has player profile
  useEffect(() => {
    if (session?.user?.player) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Handle onboarding completion
  const handleComplete = useCallback(async () => {
    // Update session to include new player data
    await update();
    // Redirect to dashboard
    router.push('/dashboard');
  }, [update, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render if no session
  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <OnboardingFlow
        userId={session.user.id}
        userName={session.user.name || undefined}
        userEmail={session.user.email || undefined}
        userImage={session.user.image || undefined}
        onComplete={handleComplete}
      />
    </div>
  );
}
