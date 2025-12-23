-- Migration: Ajouter les salons de section pour les clubs
-- Date: 2024-12-23

-- Ajouter les nouvelles colonnes à chat_rooms
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_section BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS section_order INTEGER NOT NULL DEFAULT 0;

-- Créer l'index pour les sections
CREATE INDEX IF NOT EXISTS chat_rooms_section_idx ON chat_rooms(club_id, is_section);

-- Créer les salons de section par défaut pour le club TC Pleneuf Val-André
-- (Remplacer l'UUID par l'ID réel du club si différent)
DO $$
DECLARE
    club_uuid UUID;
BEGIN
    -- Récupérer l'ID du club TC Pleneuf
    SELECT id INTO club_uuid FROM clubs WHERE slug = 'tc-pleneuf' LIMIT 1;
    
    IF club_uuid IS NOT NULL THEN
        -- Salon Général
        INSERT INTO chat_rooms (club_id, name, description, icon, is_section, section_order, is_group)
        VALUES (club_uuid, 'Général', 'Discussions générales du club', '💬', true, 1, true)
        ON CONFLICT DO NOTHING;
        
        -- Salon Annonces
        INSERT INTO chat_rooms (club_id, name, description, icon, is_section, section_order, is_group)
        VALUES (club_uuid, 'Annonces', 'Annonces officielles du club', '📢', true, 2, true)
        ON CONFLICT DO NOTHING;
        
        -- Salon Recherche partenaires
        INSERT INTO chat_rooms (club_id, name, description, icon, is_section, section_order, is_group)
        VALUES (club_uuid, 'Recherche partenaires', 'Trouvez un partenaire pour jouer', '🎾', true, 3, true)
        ON CONFLICT DO NOTHING;
        
        -- Salon Résultats
        INSERT INTO chat_rooms (club_id, name, description, icon, is_section, section_order, is_group)
        VALUES (club_uuid, 'Résultats', 'Partagez vos résultats de matchs', '🏆', true, 4, true)
        ON CONFLICT DO NOTHING;
        
        -- Salon Équipement
        INSERT INTO chat_rooms (club_id, name, description, icon, is_section, section_order, is_group)
        VALUES (club_uuid, 'Équipement', 'Discussions sur le matériel et équipement', '🏸', true, 5, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sections créées pour le club TC Pleneuf Val-André';
    ELSE
        RAISE NOTICE 'Club TC Pleneuf non trouvé - sections non créées';
    END IF;
END $$;
