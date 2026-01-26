/**
 * WhatsApp Business API Service
 * 
 * Intégration avec Meta Cloud API pour envoyer des notifications WhatsApp
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

// Configuration (à mettre dans Netlify Environment Variables)
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_VERSION = 'v21.0';
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// Types
export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

export type WhatsAppResult = 
  | { success: true; messageId: string; whatsappId: string }
  | { success: false; error: string; code?: number };

// Template types pour les notifications
export type NotificationTemplate = 
  | 'box_league_started'
  | 'match_reminder'
  | 'match_result'
  | 'new_match_proposal'
  | 'badge_unlocked';

/**
 * Vérifie si le service WhatsApp est configuré
 */
export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Formate un numéro de téléphone au format international WhatsApp
 * Enlève les espaces, tirets, et le + initial
 * Ex: "+33 6 12 34 56 78" -> "33612345678"
 */
export function formatPhoneNumber(phone: string): string {
  // Enlever tous les caractères non numériques sauf le +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Enlever le + initial
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si le numéro commence par 0 (format français), remplacer par 33
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '33' + cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Envoie un message texte simple (pour les tests)
 */
export async function sendTextMessage(
  phoneNumber: string,
  text: string
): Promise<WhatsAppResult> {
  if (!isWhatsAppConfigured()) {
    console.warn('WhatsApp not configured, skipping message');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as WhatsAppError;
      console.error('WhatsApp API error:', errorData);
      return {
        success: false,
        error: errorData.error?.message || 'Unknown error',
        code: errorData.error?.code,
      };
    }

    const successData = data as WhatsAppMessageResponse;
    return {
      success: true,
      messageId: successData.messages[0]?.id || '',
      whatsappId: successData.contacts[0]?.wa_id || '',
    };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Envoie un message template (approuvé par Meta)
 * Note: Les templates doivent être créés et approuvés dans Meta Business Manager
 */
export async function sendTemplateMessage(
  phoneNumber: string,
  templateName: string,
  languageCode: string = 'fr',
  components?: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{ type: 'text'; text: string } | { type: 'image'; image: { link: string } }>;
  }>
): Promise<WhatsAppResult> {
  if (!isWhatsAppConfigured()) {
    console.warn('WhatsApp not configured, skipping template message');
    return { success: false, error: 'WhatsApp not configured' };
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    // Ajouter les composants si fournis
    if (components && components.length > 0) {
      (body.template as Record<string, unknown>).components = components;
    }

    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as WhatsAppError;
      console.error('WhatsApp template API error:', errorData);
      return {
        success: false,
        error: errorData.error?.message || 'Unknown error',
        code: errorData.error?.code,
      };
    }

    const successData = data as WhatsAppMessageResponse;
    return {
      success: true,
      messageId: successData.messages[0]?.id || '',
      whatsappId: successData.contacts[0]?.wa_id || '',
    };
  } catch (error) {
    console.error('WhatsApp template send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================
// NOTIFICATIONS SPÉCIFIQUES TENNIS MATCH FINDER
// ============================================

/**
 * Notification: Box League démarrée
 */
export async function notifyBoxLeagueStarted(
  phoneNumber: string,
  playerName: string,
  leagueName: string,
  poolLetter: string | null,
  matchCount: number
): Promise<WhatsAppResult> {
  const poolInfo = poolLetter ? ` Tu es dans la Poule ${poolLetter}.` : '';
  const message = `🎾 Salut ${playerName} !\n\n` +
    `La *${leagueName}* vient de démarrer !${poolInfo}\n\n` +
    `📊 ${matchCount} matchs à jouer\n` +
    `⏰ Organise tes matchs avec tes adversaires\n\n` +
    `Bonne chance ! 💪\n\n` +
    `👉 tennismatchfinder.net`;

  return sendTextMessage(phoneNumber, message);
}

/**
 * Notification: Rappel de match à jouer
 */
export async function notifyMatchReminder(
  phoneNumber: string,
  playerName: string,
  opponentName: string,
  leagueName: string,
  daysLeft: number
): Promise<WhatsAppResult> {
  const urgency = daysLeft <= 3 ? '⚠️ URGENT: ' : '';
  const message = `${urgency}🎾 Rappel Match\n\n` +
    `Salut ${playerName} !\n\n` +
    `Tu as un match contre *${opponentName}* dans la ${leagueName}.\n\n` +
    `⏰ Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} pour jouer !\n\n` +
    `Contacte ton adversaire pour fixer une date.\n\n` +
    `👉 tennismatchfinder.net`;

  return sendTextMessage(phoneNumber, message);
}

/**
 * Notification: Résultat de match enregistré
 */
export async function notifyMatchResult(
  phoneNumber: string,
  playerName: string,
  opponentName: string,
  score: string,
  won: boolean,
  eloChange: number
): Promise<WhatsAppResult> {
  const resultEmoji = won ? '🏆' : '💪';
  const resultText = won ? 'Victoire' : 'Défaite';
  const eloText = eloChange >= 0 ? `+${eloChange}` : `${eloChange}`;
  
  const message = `${resultEmoji} ${resultText} !\n\n` +
    `${playerName} vs ${opponentName}\n` +
    `Score: *${score}*\n\n` +
    `📈 ELO: ${eloText} points\n\n` +
    `👉 tennismatchfinder.net`;

  return sendTextMessage(phoneNumber, message);
}

/**
 * Notification: Nouvelle proposition de match
 */
export async function notifyNewMatchProposal(
  phoneNumber: string,
  playerName: string,
  fromPlayerName: string,
  proposedDate: string
): Promise<WhatsAppResult> {
  const message = `🎾 Nouvelle proposition !\n\n` +
    `Salut ${playerName} !\n\n` +
    `*${fromPlayerName}* te propose un match le ${proposedDate}.\n\n` +
    `Connecte-toi pour accepter ou proposer une autre date.\n\n` +
    `👉 tennismatchfinder.net`;

  return sendTextMessage(phoneNumber, message);
}

/**
 * Notification: Badge débloqué
 */
export async function notifyBadgeUnlocked(
  phoneNumber: string,
  playerName: string,
  badgeName: string,
  badgeDescription: string
): Promise<WhatsAppResult> {
  const message = `🏅 Nouveau Badge !\n\n` +
    `Bravo ${playerName} !\n\n` +
    `Tu as débloqué: *${badgeName}*\n` +
    `${badgeDescription}\n\n` +
    `Continue comme ça ! 💪\n\n` +
    `👉 tennismatchfinder.net`;

  return sendTextMessage(phoneNumber, message);
}

/**
 * Notification: Box League annulée
 */
export async function notifyBoxLeagueCancelled(
  phoneNumber: string,
  playerName: string,
  leagueName: string,
  reason: string
): Promise<WhatsAppResult> {
  const message = `❌ Box League Annulée\n\n` +
    `Salut ${playerName},\n\n` +
    `La *${leagueName}* a été annulée.\n` +
    `Raison: ${reason}\n\n` +
    `D'autres compétitions arrivent bientôt !\n\n` +
    `👉 tennismatchfinder.net`;

  return sendTextMessage(phoneNumber, message);
}
