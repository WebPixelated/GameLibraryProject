-- Drop tables if they exist
DROP TABLE IF EXISTS api_cache;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS user_games;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS game_status;

-- Drop triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;