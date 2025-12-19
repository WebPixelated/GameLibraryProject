const db = require("../config/db");

class Game {
  // Find by RAWG ID
  static async findByRawgId(rawgId) {
    const result = await db.query("SELECT * FROM games WHERE rawg_id = $1", [
      rawgId,
    ]);
    return result.rows[0] || null;
  }

  // Find by Steam App ID
  static async findBySteamAppId(steamAppId) {
    const result = await db.query(
      "SELECT * FROM games WHERE steam_app_id = $1",
      [steamAppId]
    );
    return result.rows[0] || null;
  }

  // Find by title
  static async findByTitle(title) {
    const result = await db.query(
      "SELECT * FROM games WHERE LOWER(title) = LOWER($1)",
      [title]
    );
    return result.rows[0] || null;
  }

  // Add or update game
  static async upsert(gameData) {
    const {
      rawg_id,
      title,
      image_url,
      genres,
      tags,
      released,
      metacritic,
      steam_app_id,
    } = gameData;

    const result = await db.query(
      `INSERT INTO games (rawg_id, title, image_url, genres, tags, released, metacritic, steam_app_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (rawg_id) DO UPDATE SET
         title = EXCLUDED.title,
         image_url = EXCLUDED.image_url,
         genres = EXCLUDED.genres,
         tags = EXCLUDED.tags,
         metacritic = EXCLUDED.metacritic,
         steam_app_id = COALESCE(EXCLUDED.steam_app_id, games.steam_app_id)
       RETURNING *`,
      [
        rawg_id,
        title,
        image_url,
        genres,
        tags,
        released,
        metacritic,
        steam_app_id,
      ]
    );

    return result.rows[0];
  }

  // Search
  static async search(query, limit = 20) {
    const result = await db.query(
      `SELECT id, rawg_id, title, image_url, genres, tags, released, metacritic,
              ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
       FROM games
       WHERE search_vector @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT $2`,
      [query, limit]
    );
    return result.rows;
  }

  // Link Steam App ID to existing game
  static async linkSteamAppId(gameId, steamAppId) {
    const result = await db.query(
      `UPDATE games SET steam_app_id = $2 WHERE id = $1 RETURNING *`,
      [gameId, steamAppId]
    );
    return result.rows[0] || null;
  }
}

module.exports = Game;
