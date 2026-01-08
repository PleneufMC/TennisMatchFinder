import nodemailer from 'nodemailer';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_PORT === '465',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'TennisMatchFinder <noreply@tennismatchfinder.net>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback texte
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Email spécifique pour la demande de création de club
export async function sendClubCreationRequestEmail({
  requesterName,
  requesterEmail,
  clubName,
  clubDescription,
  estimatedMembers,
  approveUrl,
  rejectUrl,
}: {
  requesterName: string;
  requesterEmail: string;
  clubName: string;
  clubDescription?: string;
  estimatedMembers?: number;
  approveUrl: string;
  rejectUrl: string;
}): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'pfermanian@gmail.com';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .button { display: inline-block; padding: 15px 30px; margin: 10px 5px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .approve { background: #10b981; color: white; }
    .reject { background: #ef4444; color: white; }
    .buttons { text-align: center; margin: 30px 0; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    h1 { margin: 0; }
    .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎾 Nouvelle demande de club</h1>
      <p>TennisMatchFinder</p>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Une nouvelle demande de création de club a été soumise et nécessite votre approbation.</p>
      
      <div class="info-box">
        <p class="label">Demandeur</p>
        <p><strong>${requesterName}</strong><br>${requesterEmail}</p>
        
        <p class="label" style="margin-top: 20px;">Club demandé</p>
        <p><strong>${clubName}</strong></p>
        ${clubDescription ? `<p style="color: #6b7280;">${clubDescription}</p>` : ''}
        ${estimatedMembers ? `<p><strong>Membres estimés :</strong> ${estimatedMembers}</p>` : ''}
      </div>

      <div class="warning">
        ⚠️ <strong>Important :</strong> En approuvant cette demande, un nouveau club sera créé et ${requesterName} en deviendra l'administrateur.
      </div>

      <div class="buttons">
        <a href="${approveUrl}" class="button approve">✅ Approuver</a>
        <a href="${rejectUrl}" class="button reject">❌ Rejeter</a>
      </div>

      <p style="color: #6b7280; font-size: 12px; text-align: center;">
        Ces liens expirent dans 7 jours. Si vous ne faites rien, la demande sera automatiquement rejetée.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[TennisMatchFinder] Nouvelle demande de club : ${clubName}`,
    html,
  });
}

// Email de confirmation pour le demandeur
export async function sendClubCreationConfirmationEmail({
  to,
  requesterName,
  clubName,
  approved,
  rejectionReason,
}: {
  to: string;
  requesterName: string;
  clubName: string;
  approved: boolean;
  rejectionReason?: string;
}): Promise<boolean> {
  const html = approved
    ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
    h1 { margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Club approuvé !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${requesterName},</p>
      
      <div class="success-box">
        <h2 style="color: #059669; margin: 0;">Félicitations !</h2>
        <p>Votre club <strong>${clubName}</strong> a été approuvé.</p>
      </div>

      <p>Vous êtes maintenant l'administrateur de ce club. Vous pouvez :</p>
      <ul>
        <li>Inviter des membres</li>
        <li>Gérer les demandes d'adhésion</li>
        <li>Personnaliser le club (logo, description, etc.)</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="https://tennismatchfinder.net/dashboard" class="button">Accéder à mon club</a>
      </p>

      <p>Bonne chance avec votre club ! 🎾</p>
    </div>
  </div>
</body>
</html>
    `
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    h1 { margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Demande de club</h1>
    </div>
    <div class="content">
      <p>Bonjour ${requesterName},</p>
      
      <p>Nous avons examiné votre demande de création du club <strong>${clubName}</strong>.</p>

      <div class="info-box">
        <p><strong>Malheureusement, votre demande n'a pas pu être approuvée.</strong></p>
        ${rejectionReason ? `<p>Raison : ${rejectionReason}</p>` : ''}
      </div>

      <p>Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez plus d'informations, n'hésitez pas à nous contacter.</p>

      <p>Cordialement,<br>L'équipe TennisMatchFinder</p>
    </div>
  </div>
</body>
</html>
    `;

  return sendEmail({
    to,
    subject: approved
      ? `[TennisMatchFinder] 🎉 Votre club "${clubName}" a été approuvé !`
      : `[TennisMatchFinder] Demande de club "${clubName}"`,
    html,
  });
}

// Email de bienvenue pour un nouveau membre approuvé
export async function sendWelcomeMemberEmail({
  to,
  memberName,
  clubName,
}: {
  to: string;
  memberName: string;
  clubName: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .welcome-box { background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .feature { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; display: flex; align-items: center; gap: 15px; }
    h1 { margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎾 Bienvenue dans le club !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${memberName},</p>
      
      <div class="welcome-box">
        <h2 style="color: #059669; margin: 0;">Votre demande a été approuvée !</h2>
        <p>Vous êtes maintenant membre de <strong>${clubName}</strong></p>
      </div>

      <p>Vous pouvez désormais :</p>
      
      <div class="feature">
        <span style="font-size: 24px;">📊</span>
        <div>
          <strong>Consulter le classement</strong>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Découvrez votre position ELO parmi les membres</p>
        </div>
      </div>
      
      <div class="feature">
        <span style="font-size: 24px;">🎯</span>
        <div>
          <strong>Trouver des adversaires</strong>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Utilisez les suggestions intelligentes pour jouer</p>
        </div>
      </div>
      
      <div class="feature">
        <span style="font-size: 24px;">💬</span>
        <div>
          <strong>Participer aux discussions</strong>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Rejoignez le forum et le chat du club</p>
        </div>
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="https://tennismatchfinder.net/dashboard" class="button">Accéder à mon club</a>
      </p>

      <p>À bientôt sur les courts ! 🎾</p>
      <p>L'équipe TennisMatchFinder</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `[TennisMatchFinder] 🎾 Bienvenue dans ${clubName} !`,
    html,
  });
}

// Email de notification de rejet de demande d'adhésion
export async function sendJoinRequestRejectedEmail({
  to,
  memberName,
  clubName,
  reason,
}: {
  to: string;
  memberName: string;
  clubName: string;
  reason?: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    h1 { margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Demande d'adhésion</h1>
    </div>
    <div class="content">
      <p>Bonjour ${memberName},</p>
      
      <p>Nous avons examiné votre demande d'adhésion au club <strong>${clubName}</strong>.</p>

      <div class="info-box">
        <p><strong>Malheureusement, votre demande n'a pas pu être acceptée.</strong></p>
        ${reason ? `<p>Raison : ${reason}</p>` : ''}
      </div>

      <p>Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à contacter l'administration du club.</p>

      <p>Cordialement,<br>L'équipe TennisMatchFinder</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `[TennisMatchFinder] Demande d'adhésion à ${clubName}`,
    html,
  });
}

// Email d'invitation à rejoindre un club (utilisateur existant)
export async function sendClubInvitationEmail({
  to,
  inviteeName,
  inviterName,
  clubName,
}: {
  to: string;
  inviteeName: string;
  inviterName: string;
  clubName: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .invite-box { background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #3b82f6; }
    .button { display: inline-block; padding: 15px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
    h1 { margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎾 Invitation à rejoindre un club</h1>
    </div>
    <div class="content">
      <p>Bonjour ${inviteeName},</p>
      
      <div class="invite-box">
        <p style="margin: 0;"><strong>${inviterName}</strong> vous invite à rejoindre</p>
        <h2 style="color: #1d4ed8; margin: 10px 0;">${clubName}</h2>
        <p style="margin: 0; color: #6b7280;">sur TennisMatchFinder</p>
      </div>

      <p>En acceptant cette invitation, vous pourrez :</p>
      <ul>
        <li>Consulter le classement ELO du club</li>
        <li>Trouver des adversaires de votre niveau</li>
        <li>Enregistrer vos matchs et suivre votre progression</li>
        <li>Participer au forum et au chat du club</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="https://tennismatchfinder.net/dashboard" class="button">Voir l'invitation</a>
      </p>

      <p style="color: #6b7280; font-size: 14px;">
        Si vous n'êtes pas intéressé, vous pouvez simplement ignorer cet email.
      </p>

      <p>À bientôt sur les courts ! 🎾</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `[TennisMatchFinder] ${inviterName} vous invite à rejoindre ${clubName}`,
    html,
  });
}

// Email magic link pour nouvel utilisateur invité
export async function sendInvitationMagicLinkEmail({
  to,
  inviterName,
  clubName,
  magicLinkUrl,
}: {
  to: string;
  inviterName: string;
  clubName: string;
  magicLinkUrl: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .invite-box { background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .feature { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
    h1 { margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎾 Vous êtes invité !</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      
      <div class="invite-box">
        <p style="margin: 0;"><strong>${inviterName}</strong> vous invite à rejoindre</p>
        <h2 style="color: #059669; margin: 10px 0;">${clubName}</h2>
        <p style="margin: 0; color: #6b7280;">sur TennisMatchFinder</p>
      </div>

      <p>TennisMatchFinder est une plateforme de mise en relation pour les joueurs de tennis. Vous pourrez :</p>
      
      <div class="feature">
        ⭐ <strong>Trouver des adversaires</strong> de votre niveau grâce au système ELO
      </div>
      
      <div class="feature">
        📊 <strong>Suivre votre progression</strong> avec des statistiques détaillées
      </div>
      
      <div class="feature">
        💬 <strong>Rejoindre la communauté</strong> du club via le forum et le chat
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${magicLinkUrl}" class="button">Créer mon compte et rejoindre</a>
      </p>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Ce lien expire dans 24 heures. Si vous n'êtes pas intéressé, vous pouvez simplement ignorer cet email.
      </p>

      <p>À bientôt sur les courts ! 🎾<br>L'équipe TennisMatchFinder</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `[TennisMatchFinder] ${inviterName} vous invite à rejoindre ${clubName}`,
    html,
  });
}
