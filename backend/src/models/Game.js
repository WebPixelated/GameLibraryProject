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
      "SELECT * FROM games WHERE steam_app_id = $1 LIMIT 1",
      [steamAppId]
    );
    return result.rows[0] || null;
  }

  // Find by title (fuzzy match using trigram)
  static async findByTitle(title) {
    const result = await db.query(
      `
      SELECT *, similarity(title, $1) AS sim
      FROM games
      WHERE similarity(title, $1) > 0.3
      ORDER BY sim DESC
      LIMIT 1
      `,
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

  // Upsert from Steam
  static async upsertFromSteam({ steam_app_id, title, released, image_url }) {
    console.log(`Upserting from Steam: ${title} (app_id: ${steam_app_id})`);

    const result = await db.query(
      "SELECT upsert_game_from_steam($1, $2, $3, $4) AS game_id",
      [steam_app_id, title, released || null, image_url || null]
    );

    const gameId = result.rows[0]?.game_id;

    if (!gameId) {
      console.error(
        `No game_id returned for Steam app: ${steam_app_id}, title: ${title}`
      );
      throw new Error(`Failed to upsert game from Steam: ${title}`);
    }

    // Return full game object
    const game = await db.query("SELECT * FROM games WHERE id = $1", [gameId]);
    return game.rows[0];
  }

  static async enrichWithRawg(gameId, rawgData) {
    const result = await db.query(
      `UPDATE games SET
         rawg_id = COALESCE($2, rawg_id),
         image_url = COALESCE($3, image_url),
         genres = COALESCE($4, genres),
         tags = COALESCE($5, tags),
         metacritic = COALESCE($6, metacritic),
         source = CASE 
           WHEN steam_app_id IS NOT NULL THEN 'both'::game_source
           ELSE 'rawg'
         END
       WHERE id = $1
       RETURNING *`,
      [
        gameId,
        rawgData.rawg_id,
        rawgData.image_url,
        rawgData.genres,
        rawgData.tags,
        rawgData.metacritic,
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
