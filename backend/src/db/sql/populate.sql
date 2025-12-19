-- ============================================
-- GAME TRACKER DATABASE POPULATE SCRIPT
-- Test data for development
-- ============================================

-- Clear existing data (optional)
TRUNCATE api_cache, user_games, games, users RESTART IDENTITY CASCADE;

-- ============================================
-- USERS (passwords are bcrypt hash of 'password123')
-- ============================================
INSERT INTO users (email, password_hash, name, steam_id) VALUES
('john@example.com', '$2a$10$6TpaaV.l09ssjqwxbrptf.wByzpl.2E9SzOpE7o8Tdvcmz0EiX0tG', 'John Doe', '76561198012345678'),
('jane@example.com', '$2b$10$rQZ8kHxN9.dN9YP6RqQYN.YVxLqGjNvGbVL4YXf5VmF3hMcX5WxJa', 'Jane Smith', NULL),
('alex@example.com', '$2b$10$rQZ8kHxN9.dN9YP6RqQYN.YVxLqGjNvGbVL4YXf5VmF3hMcX5WxJa', 'Alex Gaming', '76561198087654321');

-- ============================================
-- GAMES (sample data mimicking RAWG API)
-- ============================================
INSERT INTO games (rawg_id, title, image_url, genres, released, metacritic, steam_app_id) VALUES
-- Popular AAA games
(3498, 'Grand Theft Auto V', 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg', 'Action, Adventure', '2013-09-17', 92, 271590),
(3328, 'The Witcher 3: Wild Hunt', 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6f2f4e.jpg', 'RPG, Action', '2015-05-18', 92, 292030),
(4200, 'Portal 2', 'https://media.rawg.io/media/games/328/3283617cb7d75d67257fc58339188742.jpg', 'Puzzle, Platformer', '2011-04-18', 95, 620),
(5286, 'Tomb Raider (2013)', 'https://media.rawg.io/media/games/021/021c4e21a1824d2526f925eff6324653.jpg', 'Action, Adventure', '2013-03-05', 86, 203160),
(4291, 'Counter-Strike: Global Offensive', 'https://media.rawg.io/media/games/736/73619bd336c894d6941d926bfd563946.jpg', 'Shooter, Action', '2012-08-21', 83, 730),

-- Indie games
(11859, 'Stardew Valley', 'https://media.rawg.io/media/games/713/713269608dc8f2f40f5a670a14b2de94.jpg', 'RPG, Simulation, Indie', '2016-02-26', 89, 413150),
(22511, 'Hollow Knight', 'https://media.rawg.io/media/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg', 'Action, Indie, Platformer', '2017-02-24', 90, 367520),
(28154, 'Hades', 'https://media.rawg.io/media/games/1f4/1f47a270b8f241e4f6f5f6ae79d1c2f4.jpg', 'Action, Indie, RPG', '2020-09-17', 93, 1145360),
(3070, 'Fallout 4', 'https://media.rawg.io/media/games/d82/d82990b9c67ba0d2d09d4e6fa88885a7.jpg', 'RPG, Action', '2015-11-09', 84, 377160),
(58175, 'God of War (2018)', 'https://media.rawg.io/media/games/4be/4be6a6ad0c9e5e9a7a15a7b5e3b6b4f1.jpg', 'Action, Adventure, RPG', '2022-01-14', 94, 1593500),

-- More variety
(32994, 'Celeste', 'https://media.rawg.io/media/games/594/59487800889ebac294c7c2c070d02356.jpg', 'Platformer, Indie', '2018-01-25', 92, 504230),
(802, 'Borderlands 2', 'https://media.rawg.io/media/games/49c/49c3dfa4ce2f6f140cc4825868e858cb.jpg', 'Shooter, Action, RPG', '2012-09-18', 89, 49520),
(10213, 'Dota 2', 'https://media.rawg.io/media/games/6fc/6fcf4cd3b17c288821388e6085bb0fc9.jpg', 'MOBA, Strategy', '2013-07-09', 90, 570),
(13536, 'Portal', 'https://media.rawg.io/media/games/7fa/7fa0b586293c5861ee32490e953a4996.jpg', 'Puzzle, Platformer', '2007-10-09', 90, 400),
(12020, 'Left 4 Dead 2', 'https://media.rawg.io/media/games/d58/d588947d4286e7b5e0e12e1bea7d9844.jpg', 'Shooter, Action, Horror', '2009-11-17', 89, 550),

-- Recent releases
(494384, 'Baldurs Gate 3', 'https://media.rawg.io/media/games/699/69907ecf13f172e9e1d4f2e7e1f0b8d8.jpg', 'RPG, Strategy, Adventure', '2023-08-03', 96, 1086940),
(326243, 'Elden Ring', 'https://media.rawg.io/media/games/5ec/5ecac5cb026ec26a56efcc546364e348.jpg', 'RPG, Action', '2022-02-25', 94, 1245620),
(452642, 'Cyberpunk 2077', 'https://media.rawg.io/media/games/26d/26d4437715bee60138dab4a7c8c59c92.jpg', 'RPG, Action, Shooter', '2020-12-10', 86, 1091500),
(58134, 'Marvel Spider-Man Remastered', 'https://media.rawg.io/media/games/9aa/9aa42d16abd02d4968a600e0c9a19861.jpg', 'Action, Adventure', '2022-08-12', 87, 1817070),
(41494, 'Cyberpunk 2077', 'https://media.rawg.io/media/games/26d/26d4437715bee60138dab4a7c8c59c92.jpg', 'RPG, Action', '2020-12-10', 86, 1091501);

-- ============================================
-- USER GAMES (library entries)
-- ============================================

-- John's library (user_id = 1) - Active gamer
INSERT INTO user_games (user_id, game_id, status, rating, hours_played, notes, completed_at) VALUES
(1, 1, 'completed', 9, 120.5, 'Amazing story, great online mode', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(1, 2, 'completed', 10, 180.0, 'Best RPG ever played', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, 3, 'completed', 9, 15.5, 'Perfect puzzle game', CURRENT_TIMESTAMP - INTERVAL '60 days'),
(1, 4, 'completed', 7, 25.0, NULL, CURRENT_TIMESTAMP - INTERVAL '90 days'),
(1, 5, 'playing', NULL, 450.0, 'Still grinding ranks', NULL),
(1, 6, 'playing', NULL, 85.0, 'So relaxing after work', NULL),
(1, 7, 'completed', 10, 45.0, 'Masterpiece', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(1, 8, 'completed', 9, 55.0, 'One more run...', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 16, 'wishlist', NULL, 0, 'Waiting for sale', NULL),
(1, 17, 'owned', NULL, 0, 'Will play after Witcher', NULL);

-- Jane's library (user_id = 2) - Casual gamer
INSERT INTO user_games (user_id, game_id, status, rating, hours_played, notes, completed_at) VALUES
(2, 6, 'playing', NULL, 200.0, 'My happy place', NULL),
(2, 3, 'completed', 8, 12.0, 'Fun with friends', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(2, 11, 'completed', 10, 35.0, 'Beautiful and challenging', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 7, 'dropped', 6, 5.0, 'Too difficult for me', NULL),
(2, 8, 'wishlist', NULL, 0, NULL, NULL),
(2, 2, 'wishlist', NULL, 0, 'Looks interesting', NULL);

-- Alex's library (user_id = 3) - Competitive gamer
INSERT INTO user_games (user_id, game_id, status, rating, hours_played, notes, completed_at) VALUES
(3, 5, 'playing', NULL, 2500.0, 'Global Elite grind', NULL),
(3, 13, 'playing', NULL, 3500.0, 'Immortal rank', NULL),
(3, 15, 'playing', NULL, 800.0, 'Zombie killing time', NULL),
(3, 12, 'completed', 8, 150.0, 'All DLC done', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(3, 16, 'playing', NULL, 250.0, 'So many choices...', NULL),
(3, 17, 'completed', 10, 180.0, 'Perfect combat', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(3, 1, 'dropped', 5, 20.0, 'Not my type', NULL);

-- ============================================
-- API CACHE (sample entries)
-- ============================================
INSERT INTO api_cache (cache_key, response, expires_at) VALUES
('rawg:search:witcher', '{"count": 15, "results": [{"id": 3328, "name": "The Witcher 3"}]}', CURRENT_TIMESTAMP + INTERVAL '1 hour'),
('rawg:game:3328', '{"id": 3328, "name": "The Witcher 3: Wild Hunt", "metacritic": 92}', CURRENT_TIMESTAMP + INTERVAL '24 hours'),
('rawg:search:portal', '{"count": 5, "results": [{"id": 4200, "name": "Portal 2"}]}', CURRENT_TIMESTAMP + INTERVAL '1 hour'),
('steam:library:76561198012345678', '{"game_count": 150, "games": []}', CURRENT_TIMESTAMP + INTERVAL '30 minutes');