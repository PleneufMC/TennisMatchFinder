/**
 * API Route: Marquer une tentative d'inscription comme complétée
 * POST /api/signup-attempts/complete
 * 
 * Appelée après une inscription réussie pour lier la tentative au nouvel utilisateur.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signupAttempts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const completeSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().uuid(),
  timeSpentSeconds: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, timeSpentSeconds } = completeSchema.parse(body);

    // Mettre à jour la tentative
    const [updatedAttempt] = await db
      .update(signupAttempts)
      .set({
        status: 'completed',
        convertedUserId: userId,
        convertedAt: new Date(),
        timeSpentSeconds,
        updatedAt: new Date(),
      })
      .where(eq(signupAttempts.sessionId, sessionId))
      .returning();

    if (!updatedAttempt) {
      // Pas de tentative trouvée, ce n'est pas grave (peut arriver si cookies bloqués)
      return NextResponse.json({
        success: true,
        message: 'No attempt found for this session',
      });
    }

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      convertedAt: updatedAttempt.convertedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[SignupAttempts/Complete] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
