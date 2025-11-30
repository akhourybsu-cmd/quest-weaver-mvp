-- Add unique constraint to prevent duplicate players for same user
ALTER TABLE players ADD CONSTRAINT players_user_id_unique UNIQUE (user_id);