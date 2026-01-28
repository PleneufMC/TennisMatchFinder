-- Migration: Add account deletion requests table (RGPD compliance)
-- Date: 2026-01-28
-- Description: Adds table for tracking account deletion requests with 7-day grace period

-- Create enum for deletion status
DO $$ BEGIN
    CREATE TYPE deletion_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create account_deletion_requests table
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Feedback (optional)
    reason TEXT,
    reason_category VARCHAR(50), -- 'not_using', 'privacy', 'found_alternative', 'too_complex', 'other'
    
    -- Status
    status deletion_status NOT NULL DEFAULT 'pending',
    
    -- Tokens for email confirmation/cancellation
    confirmation_token VARCHAR(100),
    cancellation_token VARCHAR(100),
    
    -- Important dates
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    scheduled_deletion_at TIMESTAMP NOT NULL, -- requested_at + 7 days
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Audit metadata
    ip_address VARCHAR(45), -- IPv6 max length
    user_agent TEXT,
    
    -- Anonymized data preserved for statistics
    anonymized_data JSONB -- { matchCount, eloAtDeletion, memberSince, ... }
);

-- Create indexes
CREATE INDEX IF NOT EXISTS account_deletion_requests_user_id_idx 
    ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS account_deletion_requests_status_idx 
    ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS account_deletion_requests_scheduled_idx 
    ON account_deletion_requests(scheduled_deletion_at);

-- Add comments for documentation
COMMENT ON TABLE account_deletion_requests IS 'RGPD-compliant account deletion requests with 7-day grace period';
COMMENT ON COLUMN account_deletion_requests.scheduled_deletion_at IS 'Date when deletion will be executed (7 days after request)';
COMMENT ON COLUMN account_deletion_requests.anonymized_data IS 'Preserved statistics after deletion (no PII)';
