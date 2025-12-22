import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// Schema de validation pour les actions du bot
const botActionSchema = z.object({
  action: z.enum(['create_thread', 'create_reply', 'add_reaction']),
  clubId: z.string().uuid(),
  data: z.object({
    // Pour create_thread
    category: z.enum(['général', 'recherche-partenaire', 'résultats', 'équipement', 'annonces']).optional(),
    title: z.string().min(5).max(200).optional(),
    content: z.string().min(10).max(10000).optional(),
    // Pour create_reply
    threadId: z.string().uuid().optional(),
    parentReplyId: z.string().uuid().optional(),
    // Pour add_reaction
    targetType: z.enum(['thread', 'reply']).optional(),
    targetId: z.string().uuid().optional(),
    emoji: z.enum(['👍', '🎾', '🔥', '😂', '🤔']).optional(),
  }),
});

type BotAction = z.infer<typeof botActionSchema>;

/**
 * Vérifie le secret du webhook
 */
function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = request.headers.get('X-Webhook-Secret');
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('N8N_WEBHOOK_SECRET not configured');
    return false;
  }

  return secret === expectedSecret;
}

/**
 * POST /api/webhooks/n8n-bot
 * Endpoint pour les actions du bot N8N
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = botActionSchema.parse(body);

    const adminClient = createAdminClient();
    let result: { id: string } | null = null;

    switch (validatedData.action) {
      case 'create_thread': {
        if (!validatedData.data.category || !validatedData.data.title || !validatedData.data.content) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for create_thread' },
            { status: 400 }
          );
        }

        const { data, error } = await adminClient
          .from('forum_threads')
          .insert({
            club_id: validatedData.clubId,
            author_id: null, // Bot post
            category: validatedData.data.category,
            title: validatedData.data.title,
            content: validatedData.data.content,
            is_bot: true,
          })
          .select('id')
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'create_reply': {
        if (!validatedData.data.threadId || !validatedData.data.content) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for create_reply' },
            { status: 400 }
          );
        }

        const { data, error } = await adminClient
          .from('forum_replies')
          .insert({
            thread_id: validatedData.data.threadId,
            author_id: null, // Bot reply
            parent_reply_id: validatedData.data.parentReplyId,
            content: validatedData.data.content,
            is_bot: true,
          })
          .select('id')
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'add_reaction': {
        if (!validatedData.data.targetType || !validatedData.data.targetId || !validatedData.data.emoji) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for add_reaction' },
            { status: 400 }
          );
        }

        // Note: Les réactions du bot nécessitent un user_id
        // Pour l'instant, on retourne une erreur car le bot ne peut pas réagir
        return NextResponse.json(
          { success: false, error: 'Bot reactions not supported yet' },
          { status: 400 }
        );
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      createdId: result?.id,
    });
  } catch (error) {
    console.error('Webhook error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS pour CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
    },
  });
}
