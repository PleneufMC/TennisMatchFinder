-- Migration: Fix push_subscriptions table columns
-- Created: 2026-01-21
-- This migration fixes the column name from 'updated_at' to 'last_used_at' to match schema

-- Add last_used_at column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE "push_subscriptions" ADD COLUMN "last_used_at" timestamp;
  END IF;
END $$;

-- Drop updated_at column if it exists (was added by mistake in initial migration)
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "push_subscriptions" DROP COLUMN "updated_at";
  END IF;
END $$;
