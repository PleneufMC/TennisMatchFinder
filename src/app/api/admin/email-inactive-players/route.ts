/**
 * API Route: Email aux joueurs inactifs (sans match)
 * 
 * Envoie un email de relance à tous les joueurs inscrits
 * qui n'ont jamais enregistré de match.
 * 
 * Usage: POST /api/admin/email-inactive-players
 * Auth: Requiert être super admin (via session) ou ADMIN_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/send-email';
import { getServerPlayer } from '@/lib/auth-helpers';
import { isSuperAdminEmail } from '@/lib/constants/admins';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Timeout de 60 secondes pour Netlify

// Vérifier si l'utilisateur est super admin
async function checkSuperAdmin(): Promise<boolean> {
  try {
    const player = await getServerPlayer();
    if (!player) return false;
    
    const [result] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, player.id))
      .limit(1);
    
    return isSuperAdminEmail(result?.email);
  } catch {
    return false;
  }
}

// Vérifier l'authentification (session super admin OU token ADMIN_SECRET)
async function isAuthorized(request: NextRequest): Promise<boolean> {
  // Méthode 1: Token ADMIN_SECRET (pour appels API externes/CRON)
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret && authHeader === `Bearer ${adminSecret}`) {
    return true;
  }
  
  // Méthode 2: Session super admin (pour dashboard)
  return await checkSuperAdmin();
}

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
  <title>Enregistre ton premier match</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎾 TennisMatchFinder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">
                Salut ${firstName} !
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Tu as rejoint TennisMatchFinder, mais tu n'as pas encore enregistré de match. 
                <strong>C'est dommage !</strong> 🙁
              </p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #166534; margin: 0; font-size: 15px;">
                  <strong>Le savais-tu ?</strong><br>
                  En enregistrant ton premier match, tu obtiens immédiatement un classement ELO 
                  et tu peux comparer ton niveau avec les autres joueurs de ton club !
                </p>
              </div>

              <h3 style="color: #1f2937; margin: 24px 0 16px 0; font-size: 18px;">
                🏆 Ce que tu gagnes en enregistrant un match :
              </h3>
              
              <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
                <li><strong>Un classement ELO personnalisé</strong> qui évolue à chaque match</li>
                <li><strong>Des suggestions d'adversaires</strong> adaptées à ton niveau</li>
                <li><strong>Des badges et récompenses</strong> à débloquer</li>
                <li><strong>Un historique complet</strong> de ta progression</li>
              </ul>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${newMatchUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);">
                      🎾 Enregistrer mon premier match
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Ça prend moins de 30 secondes !<br>
                Tu as juste besoin du score de ton dernier match.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Tu as des questions ? Réponds directement à cet email.<br>
                <a href="${unsubscribeUrl}" style="color: #9ca3af;">Gérer mes préférences email</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2026 TennisMatchFinder - Tous droits réservés<br>
                <a href="https://tennismatchfinder.net" style="color: #16a34a; text-decoration: none;">tennismatchfinder.net</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Salut ${firstName} !

Tu as rejoint TennisMatchFinder, mais tu n'as pas encore enregistré de match. C'est dommage !

Le savais-tu ?
En enregistrant ton premier match, tu obtiens immédiatement un classement ELO et tu peux comparer ton niveau avec les autres joueurs de ton club !

Ce que tu gagnes en enregistrant un match :
- Un classement ELO personnalisé qui évolue à chaque match
- Des suggestions d'adversaires adaptées à ton niveau
- Des badges et récompenses à débloquer
- Un historique complet de ta progression

👉 Enregistre ton premier match : ${newMatchUrl}

Ça prend moins de 30 secondes ! Tu as juste besoin du score de ton dernier match.

---
Tu as des questions ? Réponds directement à cet email.
Gérer mes préférences : ${unsubscribeUrl}

© 2026 TennisMatchFinder
  `;

  return { subject, html, text };
}

// GET: Prévisualisation - Liste des joueurs qui recevraient l'email
export async function GET(request: NextRequest) {
  console.log('[EmailInactive] GET - Starting request');
  
  try {
    // Vérifier l'authentification
    console.log('[EmailInactive] Checking authorization...');
    const authorized = await isAuthorized(request);
    console.log('[EmailInactive] Authorization result:', authorized);
    
    if (!authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer tous les joueurs sans match
    console.log('[EmailInactive] Fetching inactive players...');
    const inactivePlayers = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        email: users.email,
        createdAt: players.createdAt,
        matchesPlayed: players.matchesPlayed,
      })
      .from(players)
      .innerJoin(users, eq(players.id, users.id))
      .where(eq(players.matchesPlayed, 0));

    console.log('[EmailInactive] Found', inactivePlayers.length, 'inactive players');

    return NextResponse.json({
      success: true,
      message: 'Prévisualisation - Aucun email envoyé',
      count: inactivePlayers.length,
      players: inactivePlayers.map(p => ({
        id: p.id,
        name: p.fullName,
        email: p.email,
        inscritDepuis: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Admin/EmailInactive] GET Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Envoyer les emails
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    if (!await isAuthorized(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Options du body
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const limit = body.limit || 1000;

    // Récupérer tous les joueurs sans match
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

    const playersToEmail = inactivePlayers.slice(0, limit);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `Mode test - ${playersToEmail.length} emails seraient envoyés`,
        players: playersToEmail.map(p => ({
          name: p.fullName,
          email: p.email,
        })),
      });
    }

    // Envoyer les emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const player of playersToEmail) {
      if (!player.email) {
        results.failed++;
        results.errors.push(`Pas d'email pour ${player.fullName}`);
        continue;
      }

      try {
        const { subject, html, text } = generateInactivePlayerEmail(player.fullName || 'Joueur');
        
        await sendEmail({
          to: player.email,
          subject,
          html,
          text,
        });

        results.sent++;
        console.log(`[Admin/EmailInactive] Email envoyé à ${player.email}`);
        
        // Petit délai pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push(`Erreur pour ${player.email}: ${error}`);
        console.error(`[Admin/EmailInactive] Erreur envoi à ${player.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Campagne terminée`,
      stats: {
        total: playersToEmail.length,
        sent: results.sent,
        failed: results.failed,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('[Admin/EmailInactive] POST Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}
