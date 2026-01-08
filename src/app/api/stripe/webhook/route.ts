import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import {
  handleSubscriptionChange,
  handleSubscriptionDeleted,
  recordPayment,
} from '@/lib/stripe/subscription';
import type Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        
        // The subscription will be handled by customer.subscription.created
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        // Use 'any' to handle Stripe API version differences
        const subscription = event.data.object as unknown as {
          id: string;
          customer: string;
          status: string;
          current_period_start?: number;
          current_period_end?: number;
          cancel_at_period_end: boolean;
          canceled_at: number | null;
          trial_start: number | null;
          trial_end: number | null;
          items: { data: Array<{ price: { id: string } }> };
          metadata: { userId?: string };
        };
        console.log(`Subscription ${event.type}:`, subscription.id);
        
        // Extract billing cycle anchor timestamps from subscription
        const currentPeriodStart = subscription.current_period_start ?? Math.floor(Date.now() / 1000);
        const currentPeriodEnd = subscription.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
        
        await handleSubscriptionChange({
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at,
          trial_start: subscription.trial_start,
          trial_end: subscription.trial_end,
          items: subscription.items,
          metadata: subscription.metadata,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);
        
        await handleSubscriptionDeleted(subscription.id);
        break;
      }

      case 'invoice.paid': {
        // Use 'any' to handle Stripe API version differences
        const invoice = event.data.object as unknown as {
          id: string;
          subscription?: string | { id: string } | null;
          customer?: string | { id: string } | null;
          payment_intent?: string | { id: string } | null;
          amount_paid: number;
          currency: string;
        };
        console.log('Invoice paid:', invoice.id);
        
        // Get subscription ID from invoice
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id;
        
        // Get payment intent ID from invoice
        const paymentIntentId = typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent
          : invoice.payment_intent?.id;
        
        if (subscriptionId && invoice.customer) {
          // Get the subscription to find the userId
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          const userId = subscription.metadata.userId;
          if (userId && paymentIntentId && invoice.id) {
            await recordPayment(
              userId,
              paymentIntentId,
              invoice.id,
              invoice.amount_paid,
              invoice.currency,
              'succeeded'
            );
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);
        
        // The subscription status will be updated automatically by Stripe
        // and handled by customer.subscription.updated
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhooks (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};
