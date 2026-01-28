/**
 * Page Admin: Signup Attempts - Visualisation des abandons d'inscription
 * /super-admin/signup-attempts
 * 
 * Permet aux super admins de voir les tentatives d'inscription abandonnées
 * et d'exporter les emails pour des campagnes de relance.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isSuperAdminEmail } from '@/lib/constants/admins';
import { db } from '@/lib/db';
import { signupAttempts } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import { SignupAttemptsTable } from './signup-attempts-table';

export const metadata: Metadata = {
  title: 'Abandons Inscription | Super Admin',
  description: 'Visualisation des tentatives d\'inscription abandonnées',
};

export const dynamic = 'force-dynamic';

async function getSignupAttemptsData() {
  // Récupérer les tentatives récentes
  const attempts = await db
    .select()
    .from(signupAttempts)
    .orderBy(desc(signupAttempts.createdAt))
    .limit(100);

  // Stats par status
  const stats = await db
    .select({
      status: signupAttempts.status,
      count: sql<number>`count(*)::int`,
      withEmail: sql<number>`count(case when ${signupAttempts.email} is not null then 1 end)::int`,
    })
    .from(signupAttempts)
    .groupBy(signupAttempts.status);

  // Stats par étape (pour les abandons)
  const stepStats = await db
    .select({
      step: signupAttempts.lastStepReached,
      stepName: signupAttempts.lastStepName,
      count: sql<number>`count(*)::int`,
    })
    .from(signupAttempts)
    .groupBy(signupAttempts.lastStepReached, signupAttempts.lastStepName)
    .orderBy(signupAttempts.lastStepReached);

  return { attempts, stats, stepStats };
}

export default async function SignupAttemptsPage() {
  const session = await getServerSession(authOptions);
  
  // Vérifier que l'utilisateur est super admin
  if (!session?.user?.email || !isSuperAdminEmail(session.user.email)) {
    redirect('/dashboard');
  }

  const { attempts, stats, stepStats } = await getSignupAttemptsData();

  // Calculer les totaux
  const totalAttempts = stats.reduce((acc, s) => acc + s.count, 0);
  const abandonedWithEmail = stats.find(s => s.status === 'abandoned')?.withEmail || 0;
  const completedCount = stats.find(s => s.status === 'completed')?.count || 0;
  const conversionRate = totalAttempts > 0 
    ? Math.round((completedCount / totalAttempts) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abandons Inscription</h1>
        <p className="text-muted-foreground">
          Suivez les tentatives d&apos;inscription et récupérez les emails pour relance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Tentatives</div>
          <div className="text-2xl font-bold">{totalAttempts}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Abandons avec Email</div>
          <div className="text-2xl font-bold text-amber-600">{abandonedWithEmail}</div>
          <div className="text-xs text-muted-foreground">Relançables</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Convertis</div>
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Taux Conversion</div>
          <div className="text-2xl font-bold">{conversionRate}%</div>
        </div>
      </div>

      {/* Funnel par étape */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Funnel par étape</h2>
        <div className="grid gap-2">
          {stepStats.map((step) => {
            const percentage = totalAttempts > 0 
              ? Math.round((step.count / totalAttempts) * 100) 
              : 0;
            return (
              <div key={step.step} className="flex items-center gap-4">
                <div className="w-32 text-sm">
                  Step {step.step}: {step.stepName || 'N/A'}
                </div>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-20 text-right text-sm">
                  {step.count} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table des tentatives */}
      <SignupAttemptsTable attempts={attempts} />
    </div>
  );
}
