import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clubCreationRequests, clubs, players, users, chatRooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendClubCreationConfirmationEmail } from '@/lib/email/send-email';

// Force dynamic pour éviter le pre-rendering statique
export const dynamic = 'force-dynamic';

// GET: Approuver ou rejeter une demande via le lien email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const action = searchParams.get('action'); // 'approve' ou 'reject'

    if (!token || !action) {
      return createHtmlResponse('error', 'Lien invalide', 'Le lien est incomplet ou corrompu.');
    }

    if (!['approve', 'reject'].includes(action)) {
      return createHtmlResponse('error', 'Action invalide', 'L\'action demandée n\'est pas reconnue.');
    }

    // Récupérer la demande
    const [request_] = await db
      .select()
      .from(clubCreationRequests)
      .where(eq(clubCreationRequests.approvalToken, token))
      .limit(1);

    if (!request_) {
      return createHtmlResponse('error', 'Demande non trouvée', 'Cette demande n\'existe pas ou a déjà été traitée.');
    }

    // Vérifier si déjà traitée
    if (request_.status !== 'pending') {
      return createHtmlResponse(
        'info',
        'Demande déjà traitée',
        `Cette demande a déjà été ${request_.status === 'approved' ? 'approuvée' : 'rejetée'}.`
      );
    }

    // Vérifier l'expiration
    if (new Date() > request_.expiresAt) {
      await db
        .update(clubCreationRequests)
        .set({ status: 'rejected', reviewedAt: new Date() })
        .where(eq(clubCreationRequests.id, request_.id));

      return createHtmlResponse('error', 'Lien expiré', 'Ce lien a expiré. La demande a été automatiquement rejetée.');
    }

    if (action === 'reject') {
      // Rejeter la demande
      await db
        .update(clubCreationRequests)
        .set({
          status: 'rejected',
          reviewedAt: new Date(),
        })
        .where(eq(clubCreationRequests.id, request_.id));

      // Envoyer email au demandeur
      await sendClubCreationConfirmationEmail({
        to: request_.requesterEmail,
        requesterName: request_.requesterName,
        clubName: request_.clubName,
        approved: false,
      });

      return createHtmlResponse(
        'rejected',
        'Demande rejetée',
        `La demande de création du club "${request_.clubName}" a été rejetée. Un email a été envoyé à ${request_.requesterName}.`
      );
    }

    // APPROUVER LA DEMANDE
    // 1. Créer le club
    const [newClub] = await db
      .insert(clubs)
      .values({
        name: request_.clubName,
        slug: request_.clubSlug,
        description: request_.clubDescription,
        address: request_.clubAddress,
        websiteUrl: request_.clubWebsite,
        isActive: true,
      })
      .returning();

    if (!newClub) {
      return createHtmlResponse('error', 'Erreur', 'Impossible de créer le club. Veuillez réessayer.');
    }

    // 2. Récupérer l'utilisateur (non utilisé actuellement mais gardé pour référence future)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request_.userId))
      .limit(1);

    // 3. Créer le profil joueur (admin du club)
    await db.insert(players).values({
      id: request_.userId, // Lié à l'utilisateur
      clubId: newClub.id,
      fullName: request_.requesterName,
      phone: request_.requesterPhone,
      selfAssessedLevel: 'intermédiaire',
      isAdmin: true, // ADMIN DU CLUB
      isVerified: true,
      isActive: true,
    });

    // 4. Créer les salons de chat par défaut
    await db.insert(chatRooms).values([
      {
        clubId: newClub.id,
        name: 'Général',
        description: 'Discussion générale du club',
        icon: '💬',
        isSection: true,
        sectionOrder: 1,
        createdBy: request_.userId,
      },
      {
        clubId: newClub.id,
        name: 'Recherche partenaire',
        description: 'Trouvez un partenaire pour jouer',
        icon: '🎾',
        isSection: true,
        sectionOrder: 2,
        createdBy: request_.userId,
      },
      {
        clubId: newClub.id,
        name: 'Annonces',
        description: 'Annonces officielles du club',
        icon: '📢',
        isSection: true,
        sectionOrder: 3,
        createdBy: request_.userId,
      },
    ]);

    // 5. Mettre à jour la demande
    await db
      .update(clubCreationRequests)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
      })
      .where(eq(clubCreationRequests.id, request_.id));

    // 6. Envoyer email de confirmation au demandeur
    await sendClubCreationConfirmationEmail({
      to: request_.requesterEmail,
      requesterName: request_.requesterName,
      clubName: request_.clubName,
      approved: true,
    });

    return createHtmlResponse(
      'approved',
      'Club créé avec succès ! 🎉',
      `Le club "${request_.clubName}" a été créé. ${request_.requesterName} en est maintenant l'administrateur. Un email de confirmation lui a été envoyé.`,
      newClub.slug
    );
  } catch (error) {
    console.error('Error processing club approval:', error);
    return createHtmlResponse('error', 'Erreur', 'Une erreur est survenue lors du traitement de votre demande.');
  }
}

// Générer une page HTML de réponse
function createHtmlResponse(
  type: 'approved' | 'rejected' | 'error' | 'info',
  title: string,
  message: string,
  clubSlug?: string
): NextResponse {
  const colors = {
    approved: { bg: '#d1fae5', border: '#10b981', icon: '✅' },
    rejected: { bg: '#fee2e2', border: '#ef4444', icon: '❌' },
    error: { bg: '#fef3c7', border: '#f59e0b', icon: '⚠️' },
    info: { bg: '#dbeafe', border: '#3b82f6', icon: 'ℹ️' },
  };

  const color = colors[type];

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TennisMatchFinder</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: ${color.bg};
      border-left: 6px solid ${color.border};
      padding: 30px;
      text-align: center;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    p {
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .button:hover {
      background: #059669;
    }
    .footer {
      text-align: center;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">${color.icon}</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>${message}</p>
      ${type === 'approved' && clubSlug ? `
        <a href="https://tennismatchfinder.net/dashboard" class="button">
          Voir le dashboard
        </a>
      ` : `
        <a href="https://tennismatchfinder.net" class="button">
          Retour à l'accueil
        </a>
      `}
    </div>
    <div class="footer">
      🎾 TennisMatchFinder
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
