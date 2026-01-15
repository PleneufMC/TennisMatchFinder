-- ============================================
-- STRIPE SUBSCRIPTIONS MIGRATION
-- Sprint 5: Monétisation
-- Date: 2026-01-15
-- ============================================

-- 1. Create subscription_tier enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro');
    END IF;
END $$;

-- 2. Create subscription_status enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM (
            'active',
            'canceled',
            'incomplete',
            'incomplete_expired',
            'past_due',
            'paused',
            'trialing',
            'unpaid'
        );
    END IF;
END $$;

-- 3. Create subscriptions table (if not exists)
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
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- 4. Create payments table (if not exists)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'eur',
    status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed'
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_stripe_payment_intent_id_idx ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

-- 5. Add comments
COMMENT ON TABLE subscriptions IS 'User subscriptions managed by Stripe';
COMMENT ON TABLE payments IS 'Payment history from Stripe';

COMMENT ON COLUMN subscriptions.tier IS 'Subscription tier: free, premium, or pro';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End of current billing period';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Will cancel at end of period';

COMMENT ON COLUMN payments.amount IS 'Amount in cents (e.g., 9900 = 99.00 EUR)';
COMMENT ON COLUMN payments.status IS 'Payment status: succeeded, pending, failed';

-- 6. Verification
DO $$
DECLARE
    subs_exists BOOLEAN;
    payments_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'subscriptions'
    ) INTO subs_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payments'
    ) INTO payments_exists;

    IF NOT subs_exists THEN
        RAISE EXCEPTION 'Table subscriptions was not created!';
    END IF;

    IF NOT payments_exists THEN
        RAISE EXCEPTION 'Table payments was not created!';
    END IF;

    RAISE NOTICE '✅ Stripe tables created successfully!';
    RAISE NOTICE '   - subscriptions table: OK';
    RAISE NOTICE '   - payments table: OK';
END $$;
