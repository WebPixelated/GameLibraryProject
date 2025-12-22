-- ============================================
-- DROP ALL OBJECTS (SAFE RESET)
-- ============================================

-- Drop triggers
DROP TRIGGER IF EXISTS trg_games_search_vector ON games;
DROP TRIGGER IF EXISTS trg_user_games_updated_at ON user_games;
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;

-- Drop functions
DROP FUNCTION IF EXISTS upsert_game_from_steam;
DROP FUNCTION IF EXISTS cleanup_expired_cache;
DROP FUNCTION IF EXISTS update_game_search_vector;
DROP FUNCTION IF EXISTS update_updated_at;

-- Drop tables (order matters because of FKs)
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS user_games;
DROP TABLE IF EXISTS api_cache;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;

-- Drop ENUM types
DROP TYPE IF EXISTS game_status;
DROP TYPE IF EXISTS game_source;

-- Extensions are usually kept, but can be dropped if needed
-- DROP EXTENSION IF EXISTS pg_trgm;
