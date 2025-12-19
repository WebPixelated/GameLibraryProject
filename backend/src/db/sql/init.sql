-- Game status in user library
CREATE TYPE game_status AS ENUM (
    'wishlist',     -- Want to buy
    'owned',        -- Owned, not started
    'playing',      -- Currently playing
    'completed',    -- Finished
    'dropped'       -- Abandoned
);

-- ============================================
-- TABLES
-- ============================================

-- User accounts
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    steam_id        VARCHAR(50) UNIQUE,          -- For Steam library import
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games cache from RAWG API
CREATE TABLE games (
    id              SERIAL PRIMARY KEY,
    rawg_id         INTEGER NOT NULL UNIQUE,     -- RAWG API ID
    title           VARCHAR(500) NOT NULL,
    image_url       VARCHAR(1000),
    genres          VARCHAR(500),                -- "Action, RPG, Adventure"
    tags            VARCHAR(1000),
    released        DATE,
    metacritic      SMALLINT,
    steam_app_id    INTEGER UNIQUE,              -- For Steam linking
    -- Full-text search vector
    search_vector   TSVECTOR,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User game library
CREATE TABLE user_games (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    status          game_status NOT NULL DEFAULT 'owned',
    rating          SMALLINT CHECK (rating >= 1 AND rating <= 10),
    notes           TEXT,
    hours_played    DECIMAL(7,1) DEFAULT 0 CHECK (hours_played >= 0),
    completed_at    TIMESTAMP,                   -- When marked as completed
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

-- Activity log for user
CREATE TABLE activity_log (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id     INTEGER REFERENCES games(id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL,
    details     JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT action_not_empty CHECK (LENGTH(TRIM(action)) > 0)
);

-- API response cache
CREATE TABLE api_cache (
    id          SERIAL PRIMARY KEY,
    cache_key   VARCHAR(500) NOT NULL UNIQUE,   -- endpoint + params hash
    response    JSONB NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Full-text search (GIN is faster for lookups)
CREATE INDEX idx_games_search ON games USING GIN(search_vector);

-- User library queries
CREATE INDEX idx_user_games_user_id ON user_games(user_id);
CREATE INDEX idx_user_games_user_status ON user_games(user_id, status);
CREATE INDEX idx_user_games_completed ON user_games(user_id, completed_at) 
    WHERE completed_at IS NOT NULL;

-- Dashboard: games by period
CREATE INDEX idx_user_games_updated ON user_games(user_id, updated_at);

-- Cache cleanup
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_games_updated_at 
    BEFORE UPDATE ON user_games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-populate search_vector on game insert/update
CREATE OR REPLACE FUNCTION update_game_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.genres, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.tags, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_games_search_vector
    BEFORE INSERT OR UPDATE OF title, genres ON games
    FOR EACH ROW EXECUTE FUNCTION update_game_search_vector();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Cleanup expired cache entries (call via cron or periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_cache WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;