const db = require("../config/db");
const bcrypt = require("bcrypt");

class User {
  static async create(email, password, name) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, created_at
    `;
    const result = await db.query(query, [email, hashedPassword, name]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query =
      "SELECT id, email, name, steam_id, created_at FROM users WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updateSteamId(userId, steamId) {
    const query = "UPDATE users SET steam_id = $1 WHERE id = $2 RETURNING *";
    const result = await db.query(query, [steamId, userId]);
    return result.rows[0];
  }
}

module.exports = User;
