import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import {
  handleSubscriptionChange,
  handleSubscriptionDeleted,
  recordPayment,
} from '@/lib/stripe/subscription';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to safely get string value from Stripe object
function getStringValue(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string }).id;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('[Stripe Webhook] Missing signature');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error('[Stripe Webhook] Missing webhook secret');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: { type: string; data: { object: Record<string, unknown> } };

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as unknown as {
      type: string;
      data: { object: Record<string, unknown> };
    };
  } catch (err) {
    console.error('[Stripe Webhook] Invalid signature:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    const obj = event.data.object;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        console.log(`[Stripe Webhook] Processing subscription ${obj.id}`);
        
        // Extract price ID from items
        const items = obj.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
        const priceId = items?.data?.[0]?.price?.id || '';
        
        await handleSubscriptionChange({
          id: obj.id as string,
          customer: getStringValue(obj.customer) || '',
          status: obj.status as string,
          current_period_start: obj.current_period_start as number,
          current_period_end: obj.current_period_end as number,
          cancel_at_period_end: obj.cancel_at_period_end as boolean,
          canceled_at: obj.canceled_at as number | null,
          trial_start: obj.trial_start as number | null,
          trial_end: obj.trial_end as number | null,
          items: { data: [{ price: { id: priceId } }] },
          metadata: obj.metadata as { userId?: string },
        });
        
        console.log(`[Stripe Webhook] Subscription ${obj.id} processed`);
        break;
      }

      case 'customer.subscription.deleted': {
        console.log(`[Stripe Webhook] Deleting subscription ${obj.id}`);
        await handleSubscriptionDeleted(obj.id as string);
        console.log(`[Stripe Webhook] Subscription ${obj.id} deleted`);
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log(`[Stripe Webhook] Invoice paid: ${obj.id}`);

        const subscriptionId = getStringValue(obj.subscription);
          
        if (subscriptionId) {
          const sub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
            .limit(1);

          if (sub.length > 0 && sub[0]) {
            const paymentIntentId = getStringValue(obj.payment_intent) || `pi_${obj.id}`;
              
            await recordPayment(
              sub[0].userId,
              paymentIntentId,
              obj.id as string,
              obj.amount_paid as number,
              obj.currency as string,
              'succeeded',
              sub[0].id
            );
            console.log(`[Stripe Webhook] Payment recorded for user ${sub[0].userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        console.log(`[Stripe Webhook] Payment failed: ${obj.id}`);

        const subscriptionId = getStringValue(obj.subscription);
          
        if (subscriptionId) {
          const sub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
            .limit(1);

          if (sub.length > 0 && sub[0]) {
            const paymentIntentId = getStringValue(obj.payment_intent) || `failed_${obj.id}`;
              
            await recordPayment(
              sub[0].userId,
              paymentIntentId,
              obj.id as string,
              obj.amount_due as number,
              obj.currency as string,
              'failed',
              sub[0].id
            );
            
            console.log(`[Stripe Webhook] Payment failure recorded for user ${sub[0].userId}`);
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        console.log(`[Stripe Webhook] Checkout completed: ${obj.id}`);
        // The subscription webhook will handle the actual subscription creation
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
