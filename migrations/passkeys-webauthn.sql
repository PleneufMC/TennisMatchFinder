-- ============================================
-- Migration: Passkeys / WebAuthn
-- ============================================
-- TennisMatchFinder - Sprint 5
-- Date: 15 janvier 2026
-- ============================================
-- 
-- Permet la connexion biométrique (Touch ID, Face ID, empreinte digitale)
-- sur mobile et desktop via le standard WebAuthn / Passkeys.
--
-- Avantages :
-- - Connexion ultra-rapide (pas de mot de passe)
-- - Plus sécurisé que les mots de passe
-- - Expérience "app native" sur mobile
-- ============================================

-- ============================================
-- ÉTAPE 1: Table passkeys (credentials WebAuthn)
-- ============================================

CREATE TABLE IF NOT EXISTS passkeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- WebAuthn credential identifiers (base64url encoded)
    credential_id TEXT NOT NULL UNIQUE,
    credential_public_key TEXT NOT NULL,
    
    -- Counter for replay attack prevention
    counter INTEGER NOT NULL DEFAULT 0,
    
    -- Device info
    credential_device_type VARCHAR(32) NOT NULL, -- 'singleDevice' | 'multiDevice'
    credential_backed_up BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid']
    transports JSONB,
    
    -- Human-readable name (e.g., "iPhone de Pierre", "MacBook Pro")
    name VARCHAR(100),
    
    -- Usage tracking
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for passkeys
CREATE INDEX IF NOT EXISTS passkeys_user_id_idx ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS passkeys_credential_id_idx ON passkeys(credential_id);

-- ============================================
-- ÉTAPE 2: Table webauthn_challenges (temporary)
-- ============================================
-- Challenges are one-time use and expire quickly (5 minutes)

CREATE TABLE IF NOT EXISTS webauthn_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'registration' | 'authentication'
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for challenges
CREATE INDEX IF NOT EXISTS webauthn_challenges_challenge_idx ON webauthn_challenges(challenge);
CREATE INDEX IF NOT EXISTS webauthn_challenges_expires_at_idx ON webauthn_challenges(expires_at);

-- ============================================
-- ÉTAPE 3: Cleanup function for expired challenges
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_webauthn_challenges()
RETURNS void AS $$
BEGIN
    DELETE FROM webauthn_challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier les tables créées
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_name IN ('passkeys', 'webauthn_challenges')
AND table_schema = 'public';

-- ============================================
-- MESSAGE DE CONFIRMATION
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Migration WebAuthn/Passkeys terminée !';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables créées :';
    RAISE NOTICE '  - passkeys : stockage des credentials WebAuthn';
    RAISE NOTICE '  - webauthn_challenges : challenges temporaires';
    RAISE NOTICE '';
    RAISE NOTICE 'Fonctionnalités activées :';
    RAISE NOTICE '  - Connexion avec Touch ID / Face ID';
    RAISE NOTICE '  - Connexion avec empreinte digitale Android';
    RAISE NOTICE '  - Gestion multi-appareils (iCloud Keychain, etc.)';
    RAISE NOTICE '============================================';
END $$;
