-- Migration: Update TMF Saison Box League dates
-- Date: 2026-01-26
-- Description: Reopen registrations until Friday January 31st, start the league on January 31st

-- Find the TMF Saison league and update dates
UPDATE box_leagues
SET 
  registration_deadline = '2026-01-31 23:59:59',
  start_date = '2026-01-31',
  status = 'registration',
  updated_at = NOW()
WHERE name LIKE '%TMF Saison%'
  AND status = 'registration';

-- Verify the update
SELECT id, name, status, registration_deadline, start_date, end_date
FROM box_leagues
WHERE name LIKE '%TMF Saison%';
