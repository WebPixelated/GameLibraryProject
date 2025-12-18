-- Test users
INSERT INTO users (email, password_hash, name, steam_id) VALUES
('test@example.com', '$2b$10$YourHashedPasswordHere', 'Test User', '76561197960287930'),
('john@example.com', '$2b$10$YourHashedPasswordHere', 'John Doe', '76561197960287931');

-- Test games
INSERT INTO games (rawg_id, title, image_url, genres, released, metacritic, steam_app_id) VALUES
(3498, 'Grand Theft Auto V', 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg', 'Action, Adventure', '2013-09-17', 97, 271590),
(3328, 'The Witcher 3: Wild Hunt', 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg', 'RPG, Adventure', '2015-05-18', 92, 292030),
(4291, 'Counter-Strike: Global Offensive', 'https://media.rawg.io/media/games/736/73619bd336c894d6941d926bfd563946.jpg', 'Shooter', '2012-08-21', 83, 730),
(5286, 'Hades', 'https://media.rawg.io/media/games/1f4/1f47a270b8f241e4676b14d39ec620f7.jpg', 'Action, RPG, Indie', '2020-09-17', 93, 1145360);

-- Test user games
INSERT INTO user_games (user_id, game_id, status, rating, notes, hours_played) VALUES
(1, 1, 'completed', 9, 'Great game, got platinum', 120.5),
(1, 2, 'playing', NULL, 'In the middle of the game', 45.0),
(1, 3, 'dropped', 6, 'meh', 10.2),
(2, 2, 'completed', 10, 'MASTERPIECE!!!', 150.0),
(2, 4, 'wishlist', NULL, 'Wanna play', 0);

-- Test activity
INSERT INTO activity_log (user_id, game_id, action, details) VALUES
(1, 1, 'game_added', '{"status": "backlog"}'),
(1, 1, 'status_changed', '{"from": "backlog", "to": "playing"}'),
(1, 1, 'status_changed', '{"from": "playing", "to": "completed"}'),
(1, 1, 'rating_added', '{"rating": 9}'),
(1, 3, 'status_changed', '{"from": "playing", "to": "dropped"}');

-- API cache entries
-- INSERT INTO api_cache (endpoint, params, response, expires_at) VALUES
-- (
--     'search',
--     'query=witcher',
--     '{"count": 10, "results": [...]}'::jsonb,
--     CURRENT_TIMESTAMP + INTERVAL '1 hour'
-- );