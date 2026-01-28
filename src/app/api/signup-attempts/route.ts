/**
 * API Route: Signup Attempts (Capture abandons inscription)
 * POST /api/signup-attempts - Créer ou mettre à jour une tentative
 * GET /api/signup-attempts - Lister les tentatives (admin only)
 * 
 * Cette API capture les données d'inscription progressivement pour
 * permettre de relancer les utilisateurs qui abandonnent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signupAttempts, users, players } from '@/lib/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SUPER_ADMIN_EMAILS } from '@/lib/constants/admins';

// Schéma de validation pour la création/mise à jour
const signupAttemptSchema = z.object({
  sessionId: z.string().min(1), // Identifiant unique de session
  step: z.number().min(1).max(6),
  stepName: z.enum(['fullname', 'email', 'city', 'level', 'club_option', 'submit']),
  // Données optionnelles selon l'étape
  email: z.string().email().optional(),
  fullName: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  selfAssessedLevel: z.enum(['débutant', 'intermédiaire', 'avancé', 'expert']).optional(),
  wantsToJoinClub: z.boolean().optional(),
  clubSlug: z.string().optional(),
  // Analytics
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  userAgent: z.string().optional(),
  timeSpentSeconds: z.number().optional(),
});

/**
 * POST: Créer ou mettre à jour une tentative d'inscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupAttemptSchema.parse(body);
    
    const {
      sessionId,
      step,
      stepName,
      email,
      fullName,
      city,
      selfAssessedLevel,
      wantsToJoinClub,
      clubSlug,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      userAgent,
      timeSpentSeconds,
    } = validatedData;

    // Chercher une tentative existante pour cette session
    const [existingAttempt] = await db
      .select()
      .from(signupAttempts)
      .where(eq(signupAttempts.sessionId, sessionId))
      .limit(1);

    if (existingAttempt) {
      // Mettre à jour la tentative existante
      // Ne mettre à jour que les champs fournis et si l'étape est >= à la dernière
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Toujours mettre à jour l'étape si elle est plus avancée
      if (step >= existingAttempt.lastStepReached) {
        updateData.lastStepReached = step;
        updateData.lastStepName = stepName;
        updateData.status = step === 6 ? 'in_progress' : 'in_progress';
      }

      // Mettre à jour les données si fournies
      if (email) updateData.email = email.toLowerCase();
      if (fullName) updateData.fullName = fullName;
      if (city) updateData.city = city;
      if (selfAssessedLevel) updateData.selfAssessedLevel = selfAssessedLevel;
      if (typeof wantsToJoinClub === 'boolean') updateData.wantsToJoinClub = wantsToJoinClub;
      if (clubSlug !== undefined) updateData.clubSlug = clubSlug || null;
      if (timeSpentSeconds) updateData.timeSpentSeconds = timeSpentSeconds;

      await db
        .update(signupAttempts)
        .set(updateData)
        .where(eq(signupAttempts.id, existingAttempt.id));

      return NextResponse.json({
        success: true,
        attemptId: existingAttempt.id,
        action: 'updated',
        step,
      });
    } else {
      // Créer une nouvelle tentative
      const [newAttempt] = await db
        .insert(signupAttempts)
        .values({
          sessionId,
          lastStepReached: step,
          lastStepName: stepName,
          status: 'started',
          email: email?.toLowerCase(),
          fullName,
          city,
          selfAssessedLevel,
          wantsToJoinClub,
          clubSlug,
          source,
          utmSource,
          utmMedium,
          utmCampaign,
          userAgent,
          timeSpentSeconds,
        })
        .returning();

      return NextResponse.json({
        success: true,
        attemptId: newAttempt?.id,
        action: 'created',
        step,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[SignupAttempts] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET: Lister les tentatives d'inscription (admin only)
 * Query params:
 *   - status: 'abandoned' | 'completed' | 'all' (default: 'abandoned')
 *   - limit: number (default: 50)
 *   - hasEmail: 'true' | 'false' (default: 'true')
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !SUPER_ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'abandoned';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const hasEmail = searchParams.get('hasEmail') !== 'false';

    // Construire la requête
    let query = db.select().from(signupAttempts);

    // Filtrer par status
    if (status === 'abandoned') {
      query = query.where(
        and(
          eq(signupAttempts.status, 'abandoned'),
          hasEmail ? sql`${signupAttempts.email} IS NOT NULL` : sql`1=1`
        )
      ) as typeof query;
    } else if (status === 'completed') {
      query = query.where(eq(signupAttempts.status, 'completed')) as typeof query;
    } else if (status === 'in_progress') {
      query = query.where(eq(signupAttempts.status, 'in_progress')) as typeof query;
    }

    // Ajouter le tri et la limite
    const attempts = await query
      .orderBy(desc(signupAttempts.createdAt))
      .limit(limit);

    // Statistiques rapides
    const stats = await db
      .select({
        status: signupAttempts.status,
        count: sql<number>`count(*)::int`,
        withEmail: sql<number>`count(case when ${signupAttempts.email} is not null then 1 end)::int`,
      })
      .from(signupAttempts)
      .groupBy(signupAttempts.status);

    return NextResponse.json({
      attempts,
      stats,
      filters: { status, limit, hasEmail },
    });
  } catch (error) {
    console.error('[SignupAttempts] GET Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
