/**
 * API Route: Email aux joueurs inactifs (sans match)
 * 
 * Envoie un email de relance à tous les joueurs inscrits
 * qui n'ont jamais enregistré de match.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { players, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/send-email';
import { authOptions } from '@/lib/auth';
import { isSuperAdminEmail } from '@/lib/constants/admins';

export const dynamic = 'force-dynamic';

// Template email pour les joueurs sans match
function generateInactivePlayerEmail(playerName: string): { subject: string; html: string; text: string } {
  const firstName = playerName?.split(' ')[0] || 'Joueur';
  const newMatchUrl = 'https://tennismatchfinder.net/matchs/nouveau';
  const unsubscribeUrl = 'https://tennismatchfinder.net/settings';

  const subject = `🎾 ${firstName}, ton classement ELO t'attend !`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎾 TennisMatchFinder</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0;">Salut ${firstName} !</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Tu as rejoint TennisMatchFinder, mais tu n'as pas encore enregistré de match. 
                <strong>C'est dommage !</strong>
              </p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0;">
                <p style="color: #166534; margin: 0;">
                  <strong>Le savais-tu ?</strong><br>
                  En enregistrant ton premier match, tu obtiens immédiatement un classement ELO !
                </p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${newMatchUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600;">
                      🎾 Enregistrer mon premier match
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af;">Gérer mes préférences email</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Salut ${firstName} !\n\nTu as rejoint TennisMatchFinder, mais tu n'as pas encore enregistré de match.\n\n👉 Enregistre ton premier match : ${newMatchUrl}\n\n© 2026 TennisMatchFinder`;

  return { subject, html, text };
}

// GET: Prévisualisation
export async function GET() {
  try {
    // Vérifier la session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    // Vérifier si super admin
    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Accès réservé aux super admins' }, { status: 403 });
    }

    // Récupérer les joueurs sans match
    const inactivePlayers = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        email: users.email,
        createdAt: players.createdAt,
      })
      .from(players)
      .innerJoin(users, eq(players.id, users.id))
      .where(eq(players.matchesPlayed, 0));

    return NextResponse.json({
      success: true,
      count: inactivePlayers.length,
      players: inactivePlayers.map(p => ({
        id: p.id,
        name: p.fullName,
        email: p.email,
        inscritDepuis: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('[EmailInactive] GET Error:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: String(error) }, { status: 500 });
  }
}

// POST: Envoyer les emails
export async function POST(request: NextRequest) {
  try {
    // Vérifier la session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    // Vérifier si super admin
    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Accès réservé aux super admins' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    // Récupérer les joueurs sans match
    const inactivePlayers = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        email: users.email,
      })
      .from(players)
      .innerJoin(users, eq(players.id, users.id))
      .where(eq(players.matchesPlayed, 0));

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `Mode test - ${inactivePlayers.length} emails seraient envoyés`,
        players: inactivePlayers.map(p => ({ name: p.fullName, email: p.email })),
      });
    }

    // Envoyer les emails
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const player of inactivePlayers) {
      if (!player.email) {
        results.failed++;
        continue;
      }

      try {
        const { subject, html, text } = generateInactivePlayerEmail(player.fullName || 'Joueur');
        await sendEmail({ to: player.email, subject, html, text });
        results.sent++;
        // Délai pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push(`${player.email}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Campagne terminée',
      stats: { total: inactivePlayers.length, sent: results.sent, failed: results.failed },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('[EmailInactive] POST Error:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: String(error) }, { status: 500 });
  }
}
