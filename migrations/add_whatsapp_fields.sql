-- Migration: Add WhatsApp notification fields to players table
-- Date: 2026-01-26
-- Description: Adds fields for WhatsApp Business API integration

-- Add whatsapp_number column (international format: +33612345678)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Add whatsapp_opt_in column (explicit consent for notifications)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false;

-- Add whatsapp_verified column (number has been verified)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN players.whatsapp_number IS 'WhatsApp phone number in international format (e.g., 33612345678)';
COMMENT ON COLUMN players.whatsapp_opt_in IS 'User has opted in to receive WhatsApp notifications';
COMMENT ON COLUMN players.whatsapp_verified IS 'WhatsApp number has been verified via test message';
