-- ============================================
-- ENUM TYPES
-- ============================================

-- Game status in user library
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'game_status'
    ) THEN
        CREATE TYPE game_status AS ENUM (
            'wishlist',     -- Want to buy
            'owned',        -- Owned, not started
            'playing',      -- Currently playing
            'completed',    -- Finished
            'dropped'       -- Abandoned
        );
    END IF;
END $$;

-- Game source
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'game_source'
    ) THEN
        CREATE TYPE game_source AS ENUM (
            'rawg',
            'steam',
            'both'
        );
    END IF;
END $$;

-- ============================================
-- EXTENSIONS
-- ============================================

-- Extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- TABLES
-- ============================================

-- User accounts
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    steam_id        VARCHAR(50) UNIQUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games cached from RAWG API and Steam
CREATE TABLE IF NOT EXISTS games (
    id              SERIAL PRIMARY KEY,
    rawg_id         INTEGER UNIQUE,               -- RAWG API ID (nullable for Steam-only games)
    title           VARCHAR(500) NOT NULL,
    image_url       VARCHAR(1000),
    genres          VARCHAR(500),
    tags            VARCHAR(1000),
    released        DATE,
    metacritic      SMALLINT,
    steam_app_id    INTEGER,                      -- Steam App ID (not unique)
    source          game_source NOT NULL DEFAULT 'rawg',   -- 'rawg', 'steam', 'both'
    search_vector   TSVECTOR,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User game library
CREATE TABLE IF NOT EXISTS user_games (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    status          game_status NOT NULL DEFAULT 'owned',
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 10), -- Nullable
    notes           TEXT,
    hours_played    DECIMAL(7,1) DEFAULT 0 CHECK (hours_played >= 0),
    completed_at    TIMESTAMP,                                -- Editable completion date
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, game_id),
    CONSTRAINT completed_at_not_future
        CHECK (completed_at IS NULL OR completed_at <= CURRENT_TIMESTAMP)
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id     INTEGER REFERENCES games(id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL,
    details     JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT action_not_empty CHECK (LENGTH(TRIM(action)) > 0)
);

-- API response cache
CREATE TABLE IF NOT EXISTS api_cache (
    id          SERIAL PRIMARY KEY,
    cache_key   VARCHAR(500) NOT NULL UNIQUE,
    response    JSONB NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_games_search
    ON games USING GIN (search_vector);

-- Trigram search index for title
CREATE INDEX IF NOT EXISTS idx_games_title_trgm
    ON games USING GIN (title gin_trgm_ops);

-- Steam App ID lookup
CREATE INDEX IF NOT EXISTS idx_games_steam_app_id
    ON games (steam_app_id)
    WHERE steam_app_id IS NOT NULL;

-- User library queries
CREATE INDEX IF NOT EXISTS idx_user_games_user_id
    ON user_games (user_id);

CREATE INDEX IF NOT EXISTS idx_user_games_user_status
    ON user_games (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_games_completed
    ON user_games (user_id, completed_at)
    WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_games_updated
    ON user_games (user_id, updated_at);

-- Cache cleanup
CREATE INDEX IF NOT EXISTS idx_api_cache_expires
    ON api_cache (expires_at);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_user_games_updated_at ON user_games;
CREATE TRIGGER trg_user_games_updated_at
    BEFORE UPDATE ON user_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Automatically populate full-text search vector
CREATE OR REPLACE FUNCTION update_game_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector =
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple',  COALESCE(NEW.title, '')), 'A') || -- no stemming
        setweight(to_tsvector('english', COALESCE(NEW.genres, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.tags, '')),   'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_games_search_vector ON games;
CREATE TRIGGER trg_games_search_vector
    BEFORE INSERT OR UPDATE OF title, genres, tags ON games
    FOR EACH ROW EXECUTE FUNCTION update_game_search_vector();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Remove expired cache entries
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

-- Smart upsert for Steam imports
CREATE OR REPLACE FUNCTION upsert_game_from_steam(
    p_steam_app_id INTEGER,
    p_title        VARCHAR(500),
    p_released     DATE DEFAULT NULL,
    p_image_url    VARCHAR(1000) DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_game_id INTEGER;
BEGIN
    -- Try to find by Steam App ID
    SELECT id INTO v_game_id
    FROM games
    WHERE steam_app_id = p_steam_app_id;

    IF v_game_id IS NOT NULL THEN
        RETURN v_game_id;
    END IF;

    -- Try to match existing RAWG game by title and release date
    SELECT id INTO v_game_id
    FROM games
    WHERE LOWER(title) = LOWER(p_title)
      AND (released = p_released OR released IS NULL OR p_released IS NULL)
      AND steam_app_id IS NULL
    LIMIT 1;

    IF v_game_id IS NOT NULL THEN
        UPDATE games
        SET steam_app_id = p_steam_app_id,
            source       = 'both',
            image_url    = COALESCE(image_url, p_image_url)
        WHERE id = v_game_id;

        RETURN v_game_id;
    END IF;

    -- Create new Steam-only game entry
    INSERT INTO games (rawg_id, steam_app_id, title, released, image_url, source)
    VALUES (NULL, p_steam_app_id, p_title, p_released, p_image_url, 'steam')
    RETURNING id INTO v_game_id;

    RETURN v_game_id;
END;
$$ LANGUAGE plpgsql;
