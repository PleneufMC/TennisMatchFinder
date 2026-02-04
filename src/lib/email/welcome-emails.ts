/**
 * Welcome Email Templates
 * 
 * Email sequence for new user activation
 * Sprint Février 2026 - Focus: Activation
 */

import { sendEmail } from './send-email';

interface WelcomeDay1EmailParams {
  to: string;
  firstName: string;
  clubName?: string;
}

/**
 * J+1 Email: "Ton premier match"
 * Sent 24-48h after registration to users without any match
 * Goal: Get user to register their first match
 */
export async function sendWelcomeDay1Email({
  to,
  firstName,
  clubName,
}: WelcomeDay1EmailParams): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';
  const newMatchUrl = `${baseUrl}/matchs/nouveau`;
  const suggestionsUrl = `${baseUrl}/suggestions`;
  const matchNowUrl = `${baseUrl}/match-now`;
  
  // Unsubscribe link (RGPD compliance)
  const unsubscribeUrl = `${baseUrl}/settings?section=notifications`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enregistre ton premier match</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .header p {
      margin: 8px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 16px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-left: 4px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .highlight-box h3 {
      margin: 0 0 8px;
      color: #047857;
      font-size: 16px;
    }
    .highlight-box p {
      margin: 0;
      color: #065f46;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 16px 0;
      box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }
    .cta-container {
      text-align: center;
      margin: 24px 0;
    }
    .tip-box {
      background: #fef3c7;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }
    .tip-box strong {
      color: #92400e;
    }
    .tip-box p {
      margin: 0;
      color: #78350f;
      font-size: 14px;
    }
    .features {
      margin: 24px 0;
    }
    .feature {
      display: flex;
      align-items: flex-start;
      margin: 16px 0;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .feature-text h4 {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 600;
    }
    .feature-text p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
    .divider {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
      font-size: 12px;
      color: #6b7280;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
    .social-links {
      margin: 16px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #6b7280;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .container {
        padding: 12px;
      }
      .content {
        padding: 24px 16px;
      }
      .header {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="header-icon">🎾</div>
        <h1>Prêt à jouer ?</h1>
        <p>TennisMatchFinder</p>
      </div>
      
      <div class="content">
        <p class="greeting">Salut ${firstName} ! 👋</p>
        
        <p>Tu as rejoint TennisMatchFinder ${clubName ? `(${clubName})` : ''} hier — bienvenue dans la communauté !</p>
        
        <div class="highlight-box">
          <h3>🏆 Ta mission du jour</h3>
          <p>Pour commencer à construire ton classement ELO, il te suffit d'<strong>enregistrer ton premier match</strong>. C'est rapide — 30 secondes top chrono !</p>
        </div>

        <div class="cta-container">
          <a href="${newMatchUrl}" class="cta-button">
            Enregistrer un match →
          </a>
        </div>

        <div class="tip-box">
          <p>💡 <strong>Astuce :</strong> Tu peux enregistrer n'importe quel match récent, même joué avant ton inscription ! L'important c'est de commencer à alimenter ton historique.</p>
        </div>

        <hr class="divider">

        <p><strong>Pourquoi enregistrer tes matchs ?</strong></p>
        
        <div class="features">
          <div class="feature">
            <span class="feature-icon">📊</span>
            <div class="feature-text">
              <h4>Classement ELO personnalisé</h4>
              <p>Suis ta progression avec un score qui évolue à chaque match</p>
            </div>
          </div>
          
          <div class="feature">
            <span class="feature-icon">🎯</span>
            <div class="feature-text">
              <h4>Suggestions intelligentes</h4>
              <p>Plus tu joues, plus nos suggestions d'adversaires sont précises</p>
            </div>
          </div>
          
          <div class="feature">
            <span class="feature-icon">🏅</span>
            <div class="feature-text">
              <h4>Badges et récompenses</h4>
              <p>Débloque des badges en atteignant des jalons (premier match, série de victoires...)</p>
            </div>
          </div>
        </div>

        <hr class="divider">

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
          Pas encore d'adversaire ? <a href="${suggestionsUrl}" style="color: #10b981;">Découvre les suggestions</a> 
          ou active <a href="${matchNowUrl}" style="color: #10b981;">Match Now</a> pour trouver un partenaire disponible maintenant !
        </p>
      </div>
      
      <div class="footer">
        <p>Tu reçois cet email car tu t'es inscrit sur TennisMatchFinder.</p>
        <p>
          <a href="${unsubscribeUrl}">Gérer mes préférences</a> • 
          <a href="${baseUrl}">Visiter TennisMatchFinder</a>
        </p>
        <p>© ${new Date().getFullYear()} TennisMatchFinder. Tous droits réservés.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textVersion = `
Salut ${firstName} ! 👋

Tu as rejoint TennisMatchFinder ${clubName ? `(${clubName})` : ''} hier — bienvenue dans la communauté !

🏆 TA MISSION DU JOUR
Pour commencer à construire ton classement ELO, il te suffit d'enregistrer ton premier match.
C'est rapide — 30 secondes top chrono !

👉 Enregistrer un match : ${newMatchUrl}

💡 ASTUCE
Tu peux enregistrer n'importe quel match récent, même joué avant ton inscription !
L'important c'est de commencer à alimenter ton historique.

POURQUOI ENREGISTRER TES MATCHS ?

📊 Classement ELO personnalisé
Suis ta progression avec un score qui évolue à chaque match

🎯 Suggestions intelligentes
Plus tu joues, plus nos suggestions d'adversaires sont précises

🏅 Badges et récompenses
Débloque des badges en atteignant des jalons

---

Pas encore d'adversaire ?
- Découvre les suggestions : ${suggestionsUrl}
- Active Match Now : ${matchNowUrl}

---

Tu reçois cet email car tu t'es inscrit sur TennisMatchFinder.
Gérer mes préférences : ${unsubscribeUrl}

© ${new Date().getFullYear()} TennisMatchFinder. Tous droits réservés.
  `.trim();

  return sendEmail({
    to,
    subject: `${firstName}, enregistre ton premier match en 30 secondes 🎾`,
    html,
    text: textVersion,
  });
}

/**
 * J+3 Email: "Tes premiers adversaires"
 * Sent 3 days after registration if still no match
 * Goal: Show suggestions and encourage activity
 */
export async function sendWelcomeDay3Email({
  to,
  firstName,
  suggestedOpponents,
}: {
  to: string;
  firstName: string;
  suggestedOpponents: Array<{ name: string; elo: number }>;
}): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';
  const suggestionsUrl = `${baseUrl}/suggestions`;
  const unsubscribeUrl = `${baseUrl}/settings?section=notifications`;

  const opponentsList = suggestedOpponents
    .slice(0, 3)
    .map(o => `• ${o.name} (ELO ${o.elo})`)
    .join('\n');

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tes adversaires t'attendent</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; }
    .opponent-card { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 12px 0; display: flex; align-items: center; gap: 12px; }
    .opponent-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .opponent-info h4 { margin: 0; font-size: 14px; }
    .opponent-info p { margin: 4px 0 0; font-size: 12px; color: #6b7280; }
    .cta-button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .footer { text-align: center; padding: 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 8px 0; font-size: 12px; color: #6b7280; }
    .footer a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>🎯 Des joueurs t'attendent !</h1>
      </div>
      <div class="content">
        <p>Salut ${firstName} !</p>
        <p>Voici quelques joueurs de ton niveau qui cherchent aussi des partenaires :</p>
        
        ${suggestedOpponents.slice(0, 3).map(o => `
        <div class="opponent-card">
          <div class="opponent-avatar">🎾</div>
          <div class="opponent-info">
            <h4>${o.name}</h4>
            <p>ELO ${o.elo}</p>
          </div>
        </div>
        `).join('')}
        
        <div style="text-align: center;">
          <a href="${suggestionsUrl}" class="cta-button">Voir toutes les suggestions →</a>
        </div>
      </div>
      <div class="footer">
        <p><a href="${unsubscribeUrl}">Gérer mes préférences email</a></p>
        <p>© ${new Date().getFullYear()} TennisMatchFinder</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `${firstName}, ${suggestedOpponents.length} joueurs de ton niveau t'attendent 🎾`,
    html,
    text: `Salut ${firstName} !\n\nVoici quelques joueurs de ton niveau :\n${opponentsList}\n\nVoir toutes les suggestions : ${suggestionsUrl}`,
  });
}

/**
 * J+7 Email: "Tu nous manques"
 * Sent 7 days after registration if still inactive
 * Goal: Re-engagement with value proposition reminder
 */
export async function sendWelcomeDay7Email({
  to,
  firstName,
}: {
  to: string;
  firstName: string;
}): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tennismatchfinder.net';
  const dashboardUrl = `${baseUrl}/dashboard`;
  const unsubscribeUrl = `${baseUrl}/settings?section=notifications`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #fff; border-radius: 16px; padding: 32px; }
    .cta-button { display: inline-block; background: #10b981; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>👋 On t'attend sur le court, ${firstName} !</h1>
      <p>Ça fait une semaine que tu as créé ton compte. Tu n'as pas encore eu le temps de jouer ?</p>
      <p>Rappelle-toi pourquoi tu t'es inscrit :</p>
      <ul>
        <li>📊 Un classement ELO qui reflète ton vrai niveau</li>
        <li>🎯 Des adversaires de ton niveau, dans ton club ou près de chez toi</li>
        <li>🏆 Des badges, des séries, de la motivation !</li>
      </ul>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${dashboardUrl}" class="cta-button">Reprendre où tu en étais →</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        Une question ? Réponds à cet email, on est là pour t'aider.
      </p>
    </div>
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 16px;">
      <a href="${unsubscribeUrl}" style="color: #6b7280;">Se désinscrire</a>
    </p>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `${firstName}, on t'attend sur le court 🎾`,
    html,
  });
}
