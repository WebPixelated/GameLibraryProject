-- Status types
CREATE TYPE game_status AS ENUM (
    'wishlist',     
    'owned',      
    'playing',      
    'completed',    
    'dropped'       
);

-- Users table
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    steam_id        VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games (cache from RAWG)
CREATE TABLE games (
    id              SERIAL PRIMARY KEY,
    rawg_id         INTEGER NOT NULL UNIQUE,
    title           VARCHAR(500) NOT NULL,
    image_url       VARCHAR(1000),
    genres          VARCHAR(500),          
    released        DATE,
    metacritic      SMALLINT,
    steam_app_id    INTEGER, 
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's game collection
CREATE TABLE user_games (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    status          game_status NOT NULL DEFAULT 'owned',
    rating          SMALLINT CHECK (rating >= 1 AND rating <= 10),
    notes           TEXT,
    completed_at    TIMESTAMP, 
    hours_played    DECIMAL(5,1) DEFAULT 0,
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
    details     JSONB,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for API requests caching
CREATE TABLE api_cache (
    id          SERIAL PRIMARY KEY,
    endpoint    VARCHAR(255) NOT NULL,
    params      VARCHAR(500),
    response    JSONB NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endpoint, params)
);

-- Indexes for performance optimization
CREATE INDEX idx_user_games_user_id ON user_games(user_id);
CREATE INDEX idx_user_games_status ON user_games(status);
CREATE INDEX idx_user_games_created ON user_games(created_at DESC);
CREATE INDEX idx_games_rawg_id ON games(rawg_id);
CREATE INDEX idx_games_steam_id ON games(steam_app_id);
CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_steam ON users(steam_id);

-- Triggers to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_games_updated_at 
    BEFORE UPDATE ON user_games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();