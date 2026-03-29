-- Fix session 7cf506d5: set correct coach_id to Itai
UPDATE sessions SET coach_id = '81ff15e0-ff29-43e9-b0bf-1055aa8cac46' WHERE id = '7cf506d5-7c96-4636-a323-048bc1c62d9a';

-- Fix Kerem's profile: assign coach
UPDATE profiles SET coach_id = '81ff15e0-ff29-43e9-b0bf-1055aa8cac46' WHERE user_id = 'ea680683-26f7-4ac1-bce7-c41c4898084d' AND coach_id IS NULL;