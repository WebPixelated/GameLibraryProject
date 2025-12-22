const Game = require("../models/Game");
const UserGame = require("../models/UserGame");
const User = require("../models/User");
const RawgService = require("../services/RawgService");
const ImportService = require("../services/ImportService");
const SteamService = require("../services/SteamService");

// Get user's library
exports.getLibrary = async (req, res) => {
  try {
    const { status, sort, order } = req.query;

    const games = await UserGame.getUserLibrary(req.userId, {
      status,
      sortBy: sort,
      order,
    });

    res.json({
      count: games.length,
      games,
    });
  } catch (error) {
    console.error("Get library error:", error);
    res.status(500).json({
      error: "Failed to get library",
    });
  }
};

// Search for games in local/rawg db
exports.searchGames = async (req, res) => {
  try {
    const { q, source = "all" } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: "Query must be at least 2 characters",
      });
    }

    let results = { local: [], rawg: [] };

    // Search in local db
    if (source === "all" || source === "local") {
      results.local = await Game.search(q.trim());
    }

    // console.log(results);

    // Search in RAWG
    if (source === "all" || source === "rawg") {
      const rawgResults = await RawgService.searchGames(q.trim());
      results.rawg = rawgResults.results;
    }

    // console.log(results);

    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Search failed",
    });
  }
};

// Add game to user's library
exports.addGame = async (req, res) => {
  try {
    const { rawg_id, status, rating, notes } = req.body;

    if (!rawg_id) {
      return res.status(400).json({
        error: "rawg_id is required",
      });
    }

    // Check if game is in local db
    let game = await Game.findByRawgId(rawg_id);

    // If no game was found, get it from RAWG and add to local db
    if (!game) {
      const rawgGame = await RawgService.getGameById(rawg_id);
      game = await Game.upsert(rawgGame);
    }

    // Check if game is in library
    const existing = await UserGame.checkGameIsInLibrary(req.userId, game.id);
    if (existing) {
      return res.status(409).json({
        error: "Game is already in library",
        existing,
      });
    }

    // Add to user's library
    const userGame = await UserGame.addGameToLibrary(req.userId, game.id, {
      status,
      rating,
      notes,
    });

    res.status(201).json({
      ...userGame,
      game,
    });
  } catch (error) {
    console.error("Add game error:", error);
    res.status(500).json({
      error: "Failed to add game to library",
    });
  }
};

// Get specific game
exports.getGame = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        error: "Invalid ID parameter",
      });
    }

    const game = await UserGame.getGameInLibrary(req.userId, id);

    if (!game) {
      return res.status(404).json({
        error: "Game not found in library",
      });
    }

    res.json(game);
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({
      error: "Failed to get game",
    });
  }
};

// Update game
exports.updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rating, notes, hours_played } = req.body;

    if (!status && !rating && !notes && !hours_played) {
      return res.status(400).json({
        error: "Rating, status, notes or hours_played should be used",
      });
    }

    // Validation
    if (rating !== null && rating !== undefined) {
      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 10
      ) {
        return res.status(400).json({
          error: "Rating must be an integer between 1 and 10 or null",
        });
      }
    }

    if (hours_played !== undefined && hours_played < 0) {
      return res.status(400).json({
        error: "Hours played cannot be negative",
      });
    }

    const validStatuses = [
      "wishlist",
      "owned",
      "playing",
      "completed",
      "dropped",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
      });
    }

    const updated = await UserGame.updateGameInLibrary(req.userId, id, {
      status,
      rating,
      notes,
      hours_played,
    });

    if (!updated) {
      return res.status(404).json({
        error: "Game not found in library",
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update game error:", error);
    res.status(500).json({
      error: "Failed to update game",
    });
  }
};

// Delete game from library
exports.deleteGame = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await UserGame.deleteGameInLibrary(req.userId, id);

    if (!deleted) {
      return res.status(404).json({
        error: "Game not found in library",
      });
    }

    res.json({
      message: "Game removed from library",
      deleted,
    });
  } catch (error) {
    console.error("Delete game error", error);
    res.status(500).json({
      error: "Failed to delete game",
    });
  }
};

// Get stats
exports.getStats = async (req, res) => {
  try {
    const stats = await UserGame.getStats(req.userId);
    res.json(stats);
  } catch (error) {
    console.error("Get stats error", error);
    res.status(500).json({
      error: "Failed to get stats",
    });
  }
};

// Get dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [stats, dashboard] = await Promise.all([
      UserGame.getStats(req.userId),
      UserGame.getDashboard(req.userId),
    ]);

    res.json({
      stats,
      ...dashboard,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      error: "Failed to get dashboard",
    });
  }
};

// Import steam games
exports.importFromSteam = async (req, res) => {
  try {
    const { steamId, limit = 50, minPlaytime = 0 } = req.body;

    // Get user
    const user = await User.findById(req.userId);

    // Determine steam ID: from request or from profile
    let finalSteamId = steamId?.trim() || user.steam_id;

    if (!finalSteamId) {
      return res.status(400).json({
        error: "Steam ID required. Pass steamId in body or link account first.",
      });
    }

    // Normalize (handle vanity URLs)
    if (!SteamService.isValidSteamId(finalSteamId)) {
      finalSteamId = await SteamService.resolveVanityUrl(finalSteamId);
    }

    // Validate profile is public
    const profile = await SteamService.getPlayerSummary(finalSteamId);
    if (!profile.is_public) {
      return res.status(400).json({
        error: 'Steam profile is private. Set "Game details" to Public',
      });
    }

    // Save steam_id to profile if not already saved
    if (!user.steam_id) {
      await User.updateSteamId(req.userId, { steam_id: finalSteamId });
    }

    // Import
    const results = await ImportService.importFromSteam(
      req.userId,
      finalSteamId,
      {
        limit: Math.min(Number(limit) || 50, 100),
        minPlaytime: Number(minPlaytime) || 0,
      }
    );

    res.json({
      message: "Import completed",
      steam_profile: profile.persona_name,
      ...results,
    });
  } catch (error) {
    console.error("Import games from steam error:", error);
    res.status(500).json({
      error: "Failed to import steam games",
    });
  }
};
