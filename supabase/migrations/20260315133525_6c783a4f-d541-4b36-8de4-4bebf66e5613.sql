-- Fix the already published question to expire at the next hour
UPDATE courtiq_questions 
SET expires_at = date_trunc('hour', publish_at) + interval '1 hour'
WHERE id = '3adaa40f-db15-4940-9ffa-abe2edd64392';