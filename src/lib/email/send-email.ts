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
