const db = require("../config/db");

class UserGame {
  // Get user's library
  static async getUserLibrary(
    userId,
    { status, sortBy = "updated_at", order = "DESC" } = {}
  ) {
    let query = `
      SELECT 
        ug.id,
        ug.status,
        ug.rating,
        ug.hours_played,
        ug.notes,
        ug.completed_at,
        ug.created_at,
        ug.updated_at,
        g.id as game_id,
        g.rawg_id,
        g.title,
        g.image_url,
        g.genres,
        g.released,
        g.metacritic
      FROM user_games ug
      JOIN games g ON g.id = ug.game_id
      WHERE ug.user_id = $1
    `;

    const params = [userId];

    if (status) {
      params.push(status);
      query += ` AND ug.status = $${params.length}`;
    }

    // Whitelist for security reasons
    const allowedSorts = [
      "updated_at",
      "created_at",
      "hours_played",
      "rating",
      "title",
    ];
    const sortColumn = allowedSorts.includes(sortBy) ? sortBy : "updated_at";
    const sortOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Sort by title alphabetically
    if (sortColumn === "title") {
      query += ` ORDER BY g.title ${sortOrder}`;
    } else {
      query += ` ORDER BY ug.${sortColumn} ${sortOrder} NULLS LAST`;
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  // Find specific game in library
  static async getGameInLibrary(userId, userGameId) {
    const result = await db.query(
      `SELECT 
        ug.*,
        g.rawg_id, g.title, g.image_url, g.genres, g.released, g.metacritic
       FROM user_games ug
       JOIN games g ON g.id = ug.game_id
       WHERE ug.game_id = $1 AND ug.user_id = $2`,
      [userGameId, userId]
    );
    return result.rows[0] || null;
  }

  // Check if game is in library
  static async checkGameIsInLibrary(userId, gameId) {
    const result = await db.query(
      "SELECT * FROM user_games WHERE user_id = $1 AND game_id = $2",
      [userId, gameId]
    );
    return result.rows[0] || null;
  }

  // Add game to library
  static async addGameToLibrary(userId, gameId, data = {}) {
    const { status = "owned", rating, notes, hours_played = 0 } = data;

    const result = await db.query(
      `INSERT INTO user_games (user_id, game_id, status, rating, notes, hours_played)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, gameId, status, rating, notes, hours_played]
    );

    return result.rows[0];
  }

  // Update game in library
  static async updateGameInLibrary(userId, userGameId, data) {
    const { status, rating, notes, hours_played } = data;

    // Set completed at if necessary
    let completed_at = null;
    if (status === "completed") {
      const current = await this.getGameInLibrary(userId, userGameId);
      if (current && current.status !== "completed") {
        completed_at = new Date();
      } else if (current) {
        completed_at = current.completed_at;
      }
    }

    const result = await db.query(
      `UPDATE user_games 
       SET 
         status = COALESCE($3, status),
         rating = COALESCE($4, rating),
         notes = COALESCE($5, notes),
         hours_played = COALESCE($6, hours_played),
         completed_at = $7
       WHERE game_id = $1 AND user_id = $2
       RETURNING *`,
      [userGameId, userId, status, rating, notes, hours_played, completed_at]
    );

    return result.rows[0] || null;
  }

  // Delete game from library
  static async deleteGameInLibrary(userId, userGameId) {
    const result = await db.query(
      "DELETE FROM user_games WHERE game_id = $1 AND user_id = $2 RETURNING *",
      [userGameId, userId]
    );
    return result.rows[0] || null;
  }

  // User stats
  static async getStats(userId) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_games,
        COUNT(*) FILTER (WHERE status = 'wishlist') AS wishlist,
        COUNT(*) FILTER (WHERE status = 'owned') AS owned,
        COUNT(*) FILTER (WHERE status = 'playing') AS playing,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'dropped') AS dropped,
        COALESCE(SUM(hours_played), 0) AS total_hours,
        COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating,
        COUNT(rating) AS rated_games
      FROM user_games
      WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // Dashboard data
  static async getDashboard(userId) {
    // Get multiple requests as one promise
    const [recentlyAdded, recentlyCompleted, currentlyPlaying, twoWeeksStats] =
      await Promise.all([
        // Last 5 added
        db.query(
          `SELECT ug.id, ug.status, ug.created_at, g.title, g.image_url
          FROM user_games ug
          JOIN games g ON g.id = ug.game_id
          WHERE ug.user_id = $1
          ORDER BY ug.created_at DESC
          LIMIT 5`,
          [userId]
        ),

        // Last 5 completed
        db.query(
          `SELECT ug.id, ug.rating, ug.hours_played, ug.completed_at, g.title, g.image_url
          FROM user_games ug
          JOIN games g ON g.id = ug.game_id
          WHERE ug.user_id = $1 AND ug.status = 'completed' AND ug.completed_at IS NOT NULL
          ORDER BY ug.completed_at DESC
          LIMIT 5`,
          [userId]
        ),

        // Currently playing
        db.query(
          `SELECT ug.id, ug.hours_played, g.title, g.image_url
          FROM user_games ug
          JOIN games g ON g.id = ug.game_id
          WHERE ug.user_id = $1 AND ug.status = 'playing'
          ORDER BY ug.updated_at DESC
          LIMIT 5`,
          [userId]
        ),

        // Stats for last 2 weeks
        db.query(
          `SELECT 
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '14 days') AS games_added,
            COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '14 days') AS games_completed,
            COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '7 days') AS games_completed_week
          FROM user_games
          WHERE user_id = $1`,
          [userId]
        ),
      ]);

    return {
      recently_added: recentlyAdded.rows,
      recently_completed: recentlyCompleted.rows,
      currently_playing: currentlyPlaying.rows,
      two_weeks: twoWeeksStats.rows[0],
    };
  }

  // Bulk add / Steam import
  static async addGamesBulk(userId, games) {
    const results = [];

    for (const game of games) {
      const existing = await this.checkGameIsInLibrary(userId, game.gameId);
      if (!existing) {
        const created = await this.addGameToLibrary(userId, game.gameId, {
          status: "owned",
          hours_played: game.hours_played || 0,
        });
        results.push(created);
      }
    }

    return results;
  }
}

module.exports = UserGame;
