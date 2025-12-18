-- ============================================
-- DROP TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trg_games_search_vector ON games;
DROP TRIGGER IF EXISTS trg_user_games_updated_at ON user_games;
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;

-- ============================================
-- DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS update_game_search_vector();
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS cleanup_expired_cache();

-- ============================================
-- DROP INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_api_cache_expires;
DROP INDEX IF EXISTS idx_user_games_updated;
DROP INDEX IF EXISTS idx_user_games_completed;
DROP INDEX IF EXISTS idx_user_games_user_status;
DROP INDEX IF EXISTS idx_user_games_user_id;
DROP INDEX IF EXISTS idx_games_search;

-- ============================================
-- DROP TABLES
-- ============================================

DROP TABLE IF EXISTS api_cache;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS user_games;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;

-- ============================================
-- DROP TYPES
-- ============================================

DROP TYPE IF EXISTS game_status;
