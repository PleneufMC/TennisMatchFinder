-- ============================================
-- SEED DATA - Club de démonstration
-- ============================================

-- Insérer un club de démonstration
INSERT INTO clubs (name, slug, description, is_active)
VALUES (
    'TC Pleneuf Val-André',
    'tc-pleneuf',
    'Club de tennis de Pléneuf-Val-André - Bienvenue sur Tennis MatchFinder !',
    true
)
ON CONFLICT (slug) DO NOTHING;
