-- Migration: Match Validation & Contestation System
-- Sprint 4: Système de validation anti-churn
-- Date: 2026-01-14
--
-- Cette migration ajoute le système d'auto-validation et de contestation des matchs.
-- - Auto-validation après 24h sans réponse
-- - Rappel après 6h
-- - Contestation possible 7 jours après validation
-- - Limite de 3 contestations par mois

-- ===========================================
-- AJOUT DES COLONNES DE VALIDATION AUTO
-- ===========================================

-- Colonne pour le flag d'auto-validation
ALTER TABLE matches ADD COLUMN IF NOT EXISTS auto_validated BOOLEAN DEFAULT FALSE NOT NULL;

-- Date prévue d'auto-validation (24h après création)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS auto_validate_at TIMESTAMP;

-- Date d'envoi du rappel (6h après création)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

-- ===========================================
-- AJOUT DES COLONNES DE CONTESTATION
-- ===========================================

-- Flag de contestation
ALTER TABLE matches ADD COLUMN IF NOT EXISTS contested BOOLEAN DEFAULT FALSE NOT NULL;

-- Joueur qui a contesté
ALTER TABLE matches ADD COLUMN IF NOT EXISTS contested_by UUID REFERENCES players(id);

-- Date de contestation
ALTER TABLE matches ADD COLUMN IF NOT EXISTS contested_at TIMESTAMP;

-- Raison de la contestation
ALTER TABLE matches ADD COLUMN IF NOT EXISTS contest_reason TEXT;

-- Date de résolution
ALTER TABLE matches ADD COLUMN IF NOT EXISTS contest_resolved_at TIMESTAMP;

-- Résolution ('upheld' = maintenu, 'rejected' = rejeté, 'modified' = modifié)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS contest_resolution VARCHAR(50);

-- ===========================================
-- INDEX POUR PERFORMANCES
-- ===========================================

-- Index pour les requêtes CRON d'auto-validation
CREATE INDEX IF NOT EXISTS matches_auto_validate_at_idx ON matches(auto_validate_at);

-- Index pour les matchs contestés
CREATE INDEX IF NOT EXISTS matches_contested_idx ON matches(contested);

-- Index pour les matchs non validés
CREATE INDEX IF NOT EXISTS matches_validated_idx ON matches(validated);

-- ===========================================
-- MISE À JOUR DES MATCHS EXISTANTS
-- ===========================================

-- Définir auto_validate_at pour les matchs en attente (24h après création)
-- Note: Ne s'applique qu'aux matchs non validés sans date d'auto-validation
UPDATE matches 
SET auto_validate_at = created_at + INTERVAL '24 hours'
WHERE validated = FALSE 
  AND auto_validate_at IS NULL
  AND contested = FALSE;

-- ===========================================
-- COMMENTAIRES
-- ===========================================

COMMENT ON COLUMN matches.auto_validated IS 'True si le match a été validé automatiquement (sans confirmation manuelle)';
COMMENT ON COLUMN matches.auto_validate_at IS 'Date et heure prévues pour l''auto-validation (24h après déclaration)';
COMMENT ON COLUMN matches.reminder_sent_at IS 'Date d''envoi du rappel de confirmation (6h après déclaration)';
COMMENT ON COLUMN matches.contested IS 'True si le match a été contesté par un joueur';
COMMENT ON COLUMN matches.contested_by IS 'ID du joueur qui a contesté le match';
COMMENT ON COLUMN matches.contested_at IS 'Date et heure de la contestation';
COMMENT ON COLUMN matches.contest_reason IS 'Raison fournie pour la contestation';
COMMENT ON COLUMN matches.contest_resolved_at IS 'Date de résolution de la contestation par un admin';
COMMENT ON COLUMN matches.contest_resolution IS 'Résultat de la contestation: upheld (maintenu), rejected (rejeté), modified (score modifié)';

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Vérifier que les colonnes ont été ajoutées
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'auto_validated') THEN
    RAISE EXCEPTION 'Column auto_validated not added to matches table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'contested') THEN
    RAISE EXCEPTION 'Column contested not added to matches table';
  END IF;
  RAISE NOTICE 'Migration match-validation-contestation completed successfully';
END $$;
