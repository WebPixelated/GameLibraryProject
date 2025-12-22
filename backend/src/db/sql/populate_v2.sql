-- Users
INSERT INTO users (email, password_hash, name, steam_id, created_at, updated_at)
VALUES (
    'maksim@example.com',
    '$2b$10$DJYXC4aeYoB/6lfqvLOh8.eqe2MgucibQGuH6HvlilyDErZEfZs2S',
    'Maksim M',
    NULL,
    '2025-12-21 14:10:54.921042',
    '2025-12-21 14:10:54.921042'
);

-- Games
INSERT INTO games (
    rawg_id, title, image_url, genres, tags,
    released, metacritic, steam_app_id, source,
    search_vector, created_at
) VALUES
(3328, 'The Witcher 3: Wild Hunt',
 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg',
 'Action, RPG',
 'Singleplayer, Atmospheric, Great Soundtrack, RPG, Story Rich, Open World, Third Person, Fantasy, Sandbox, Action RPG',
 '2015-05-18', 92, NULL, 'rawg',
 to_tsvector('english', 'The Witcher 3 Wild Hunt Action RPG'),
 '2025-12-21 14:11:28.283612'),

(422, 'Terraria',
 'https://media.rawg.io/media/games/f46/f466571d536f2e3ea9e815ad17177501.jpg',
 'Action, Indie, Platformer',
 'Singleplayer, Steam Achievements, Multiplayer, Steam Cloud, RPG, Co-op, Open World, 2D',
 '2011-05-16', 81, NULL, 'rawg',
 to_tsvector('english', 'Terraria Action Indie Platformer'),
 '2025-12-21 14:12:04.094836'),

(2454, 'DOOM (2016)',
 'https://media.rawg.io/media/games/587/587588c64afbff80e6f444eb2e46f9da.jpg',
 'Action, Shooter',
 'Singleplayer, Multiplayer, Co-op, First-Person, Sci-fi, Horror',
 '2016-05-12', 85, NULL, 'rawg',
 to_tsvector('english', 'DOOM 2016 Action Shooter'),
 '2025-12-21 14:15:35.110285'),

(52884, 'DOOM',
 'https://media.rawg.io/media/games/47b/47b50d880be8453bf9cda6e5c007bc26.jpg',
 'Action, Shooter',
 'Singleplayer, FPS, Horror, Classic',
 '1993-12-10', 83, NULL, 'rawg',
 to_tsvector('english', 'DOOM Classic FPS'),
 '2025-12-21 14:15:49.208807');

-- User games
INSERT INTO user_games (
    user_id, game_id, status,
    rating, notes, hours_played,
    completed_at, created_at, updated_at
) VALUES
(1, 1, 'playing', 10, 'Great game', 50, NULL,
 '2025-12-21 14:11:28.296948', '2025-12-21 14:11:37.929377'),

(1, 2, 'completed', 10, 'Great game', 553,
 '2025-12-21 14:12:42.474',
 '2025-12-21 14:12:04.102536', '2025-12-21 14:12:42.474328'),

(1, 3, 'completed', 9, 'Completed!', 50,
 '2025-12-21 14:17:22.938',
 '2025-12-21 14:15:35.11617', '2025-12-21 14:17:22.93963'),

(1, 4, 'completed', 10, 'One of the best FPS ever made!', 60,
 '2025-12-21 14:19:26.252',
 '2025-12-21 14:15:40.702805', '2025-12-21 14:19:26.25345');
