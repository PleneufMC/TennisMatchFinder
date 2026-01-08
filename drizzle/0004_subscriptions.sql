-- Migration: Add subscription and payment tables for Stripe integration
-- Date: 2026-01-08

-- Create subscription status enum
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active',
    'canceled', 
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create subscription tier enum
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'free',
    'premium',
    'pro'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'eur',
  status VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_stripe_payment_intent_id_idx ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
