require("../config/env");
const axios = require("axios");

const STEAM_API_BASE = process.env.STEAM_BASE_URL;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

class SteamService {
  // Validate Steam API Key
  static ensureApiKey() {
    if (!STEAM_API_KEY) {
      throw new Error("Steam API key not configured");
    }
  }

  // Validate Steam ID
  static isValidSteamId(steamId) {
    return /^\d{17}$/.test(steamId);
  }

  // Resolve vanity URL to Steam ID
  static async resolveVanityUrl(vanityName) {
    this.ensureApiKey();

    const response = await axios.get(
      `${STEAM_API_BASE}/ISteamUser/ResolveVanityUrl/v1/`,
      {
        params: {
          key: STEAM_API_KEY,
          vanityurl: vanityName,
        },
      }
    );

    if (response.data.response.success !== 1) {
      throw new Error("Steam user not found");
    }

    return response.data.response.steamid;
  }

  // Get Steam user profile
  static async getPlayerSummary(steamId) {
    this.ensureApiKey();

    const response = await axios.get(
      `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`,
      {
        params: {
          key: STEAM_API_KEY,
          steamids: steamId,
        },
      }
    );

    const player = response.data.response.players[0];

    if (!player) {
      throw new Error("Steam user not found");
    }

    return {
      steam_id: player.steamid,
      persona_name: player.personaname,
      avatar: player.avatarfull,
      profile_url: player.profileurl,
      is_public: player.communityvisibilitystate === 3,
    };
  }

  // Get user's owned games from Steam
  static async getOwnedGames(steamId) {
    this.ensureApiKey();

    if (!this.isValidSteamId(steamId)) {
      throw new Error("Invalid Steam ID format");
    }

    const response = await axios.get(
      `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`,
      {
        params: {
          key: STEAM_API_KEY,
          steamid: steamId,
          include_appinfo: true,
          include_played_free_games: true,
        },
      }
    );

    if (!response.data.response || !response.data.response.games) {
      throw new Error(
        'Steam profile is private or has no games. Set "Game details" to Public in Steam privacy settings.'
      );
    }

    return response.data.response.games.map((game) => ({
      steam_app_id: game.appid,
      name: game.name,
      playtime_minutes: game.playtime_forever || 0,
      playtime_hours: Math.round(((game.playtime_forever || 0) / 60) * 10) / 10,
      icon_url: game.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
        : null,
    }));
  }

  // Normalize Steam ID input (handle vanity URLs)
  static async normalizeSteamId(input) {
    const trimmed = input.trim();

    if (this.isValidSteamId(trimmed)) {
      return trimmed;
    }

    // Try as vanity URL
    return await this.resolveVanityUrl(trimmed);
  }
}

module.exports = SteamService;
