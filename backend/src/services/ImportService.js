const SteamService = require("./SteamService");
const RawgService = require("./RawgService");
const Game = require("../models/Game");
const UserGame = require("../models/UserGame");

class ImportService {
  // Import games from Steam
  static async importFromSteam(userId, steamId, options = {}) {
    const { limit = 50, minPlaytime = 0, enrichWithRawg = true } = options;

    // Get games from Steam
    const steamGames = await SteamService.getOwnedGames(steamId);

    // Filter and sort
    let gamesToProcess = steamGames;

    if (minPlaytime > 0) {
      gamesToProcess = gamesToProcess.filter(
        (g) => g.playtime_minutes >= minPlaytime
      );
    }

    gamesToProcess.sort((a, b) => b.playtime_minutes - a.playtime_minutes);
    gamesToProcess = gamesToProcess.slice(0, limit);

    const results = {
      total_in_steam: steamGames.length,
      processed: 0,
      imported: [],
      updated: [],
      skipped: [],
      failed: [],
    };

    // Process each game
    for (const steamGame of gamesToProcess) {
      results.processed++;

      try {
        // Try to find existing game by steam_app_id
        let game = await Game.findBySteamAppId(steamGame.steam_app_id);

        if (game) {
          // Game exists in DB — check user's library first
          const existingEntry = await UserGame.checkGameIsInLibrary(
            userId,
            game.id
          );

          if (existingEntry) {
            // Already in library — just update hours if needed
            if (
              steamGame.playtime_hours >
              (parseFloat(existingEntry.hours_played) || 0)
            ) {
              await UserGame.updateGameInLibrary(userId, existingEntry.id, {
                hours_played: steamGame.playtime_hours,
              });
              results.updated.push({
                name: game.title,
                hours_played: steamGame.playtime_hours,
              });
            } else {
              results.skipped.push({
                name: game.title,
                reason: "Already in library",
              });
            }
            continue; // Skip to next game, no RAWG call needed
          }

          // Game exists but not in library — add it
          // Enrich if no RAWG data yet
          if (enrichWithRawg && !game.rawg_id) {
            game = await this.tryEnrichWithRawg(game, steamGame.name);
          }
        } else {
          // Game not in DB — upsert and enrich
          game = await Game.upsertFromSteam({
            steam_app_id: steamGame.steam_app_id,
            title: steamGame.name,
            image_url: steamGame.icon_url,
          });

          if (enrichWithRawg && !game.rawg_id) {
            game = await this.tryEnrichWithRawg(game, steamGame.name);
          }
        }

        // Check if game is undefined
        if (!game) {
          throw new Error(
            `Failed to create/retrieve game object for ${steamGame.name}`
          );
        }

        // Add to user's library
        // const status = steamGame.playtime_hours > 0 ? "playing" : "owned";
        const status = "owned";

        await UserGame.addGameToLibrary(userId, game.id, {
          status,
          hours_played: steamGame.playtime_hours,
        });

        results.imported.push({
          game_id: game.id,
          name: game.title,
          hours_played: steamGame.playtime_hours,
          status,
          has_rawg_data: !!game.rawg_id,
        });
      } catch (error) {
        console.error(`Failed to import "${steamGame.name}":`, error.message);
        results.failed.push({
          name: steamGame.name,
          steam_app_id: steamGame.steam_app_id,
          error: error.message,
        });
      }
    }

    return results;
  }

  static async tryEnrichWithRawg(game, gameName) {
    try {
      await this.delay(200); // Rate limiting
      const rawgData = await RawgService.findGameByName(gameName);
      if (rawgData) {
        return await Game.enrichWithRawg(game.id, rawgData);
      }
    } catch (e) {
      console.log(`RAWG enrichment failed for "${gameName}": ${e.message}`);
    }

    return game; // Return init game if unsuccessful
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = ImportService;
