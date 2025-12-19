require("../config/db");
const axios = require("axios");
const db = require("../config/db");

const RAWG_BASE_URL = process.env.RAWG_BASE_URL;
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const CACHE_TTL = process.env.RAWG_CACHE_TTL || 60 * 60 * 1000; // 1 hour in ms

console.log(RAWG_BASE_URL);

class RawgService {
  // Check cache
  static async getResponseFromCache(cacheKey) {
    const result = await db.query(
      `SELECT response FROM api_cache 
       WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );

    if (!result.rows[0]) return null;

    const response = result.rows[0].response;
    return typeof response === "string" ? JSON.parse(response) : response;
  }

  // Save data in cache
  static async saveResponseToCache(cacheKey, response, ttlMs = CACHE_TTL) {
    try {
      const ttl =
        typeof ttlMs === "number" && !isNaN(ttlMs) ? ttlMs : CACHE_TTL;

      // Create date through timestamp
      const now = Date.now();
      const expiresAt = new Date(now + ttl);

      if (isNaN(expiresAt.getTime())) {
        console.error("Invalid expires_at date, skipping cache");
        return;
      }

      await db.query(
        `INSERT INTO api_cache (cache_key, response, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (cache_key) DO UPDATE SET
         response = EXCLUDED.response,
         expires_at = EXCLUDED.expires_at`,
        [cacheKey, JSON.stringify(response), expiresAt]
      );
    } catch (error) {
      console.error("Cache write error:", error.message);
    }
  }

  // Search games in RAWG
  static async searchGames(query, page = 1, pageSize = 20) {
    const cacheKey = `rawg:search:${query}:${page}:${pageSize}`;

    // Check cache first
    const cached = await this.getResponseFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // RAWG Request
    const response = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        search: query,
        page: page,
        page_size: pageSize,
        search_precise: true,
      },
    });

    const data = {
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: response.data.results.map((game) => this.formatGame(game)),
    };

    // Save response in cache
    await this.saveResponseToCache(cacheKey, data);

    return data;
  }

  // Get game by ID
  static async getGameById(rawgId) {
    const cacheKey = `rawg:game:${rawgId}`;

    const cached = await this.getResponseFromCache(cacheKey);
    if (cached) {
      return typeof cached === "string" ? JSON.parse(cached) : cached;
    }

    const response = await axios.get(`${RAWG_BASE_URL}/games/${rawgId}`, {
      params: { key: RAWG_API_KEY },
    });

    const data = this.formatGameDetails(response.data);

    // Cache for 24 hours
    await this.saveResponseToCache(cacheKey, data, 24 * 60 * 60 * 1000);

    return data;
  }

  // Format game corresponding to table in db
  static formatGame(game) {
    return {
      rawg_id: game.id,
      slug: game.slug,
      title: game.name,
      image_url: game.background_image,
      released: game.released,
      metacritic: game.metacritic,
      rating: game.rating,
      // Genres available in list
      genres: game.genres?.map((g) => g.name).join(", ") || null,
      genres_list: game.genres || [],
      // Platforms summary
      platforms: game.platforms?.map((p) => p.platform.name).join(", ") || null,
    };
  }

  // Format game details
  static formatGameDetails(game) {
    // Extract genres
    const genres = game.genres?.map((g) => g.name).join(", ") || null;

    // Extract important tags (first 10, skip technical ones)
    const skipTags = ["Full controller support", "controller support"];
    const tags =
      game.tags
        ?.filter((t) => t.language === "eng" && !skipTags.includes(t.name))
        .slice(0, 10)
        .map((t) => t.name)
        .join(", ") || null;

    // Check if available on Steam
    const steamStore = game.stores?.find((s) => s.store.slug === "steam");
    const hasOnSteam = !!steamStore;

    // Platforms
    const platforms =
      game.platforms?.map((p) => p.platform.name).join(", ") || null;

    return {
      rawg_id: game.id,
      slug: game.slug,
      title: game.name,
      image_url: game.background_image,
      released: game.released,
      metacritic: game.metacritic,
      rating: game.rating,
      playtime: game.playtime, // Average playtime in hours

      // Text fields for DB
      genres: genres,
      tags: tags,
      platforms: platforms,

      // Structured data (for display)
      genres_list: game.genres || [],
      tags_list:
        game.tags?.filter((t) => t.language === "eng").slice(0, 10) || [],

      // Steam info
      on_steam: hasOnSteam,

      // Additional details
      description: game.description_raw || game.description,
      website: game.website,
      esrb_rating: game.esrb_rating?.name || null,
    };
  }

  static async searchAndGetDetails(query) {
    const searchResults = await this.searchGames(query, 1, 5);

    if (searchResults.results.length === 0) {
      return null;
    }

    // Get full details for first result
    const firstResult = searchResults.results[0];
    return await this.getGameById(firstResult.rawg_id);
  }

  static async findGameByName(name) {
    try {
      const searchResults = await this.searchGames(name, 1, 5);

      if (searchResults.results.length === 0) {
        return null;
      }

      // Try to find exact match first
      const exactMatch = searchResults.results.find(
        (g) => g.title.toLowerCase() === name.toLowerCase()
      );

      if (exactMatch) {
        return await this.getGameById(exactMatch.rawg_id);
      }

      // Otherwise return first result
      return await this.getGameById(searchResults.results[0].rawg_id);
    } catch (error) {
      console.error(`Failed to find game "${name}":`, error.message);
      return null;
    }
  }
}

module.exports = RawgService;
