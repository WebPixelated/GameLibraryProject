require("../../config/env");
const fs = require("fs");
const path = require("path");

const pool = require("../../config/db");

async function populateDatabase() {
  try {
    const populateSql = fs.readFileSync(
      path.join(__dirname, "../sql/populate_v2.sql"),
      "utf-8"
    );

    console.log("Populating initial data...");
    await pool.query(populateSql);
    console.log("Initial data populated successfully!");

    // Verify inserted data
    const users = await pool.query("SELECT * FROM users;");
    const games = await pool.query("SELECT * FROM games;");
    const user_games = await pool.query("SELECT * FROM user_games;");

    console.log("Users:", users.rows.length);
    console.log("Games:", games.rows.length);
    console.log("User Games:", user_games.rows.length);
  } catch (error) {
    console.error("Error populating database:", error);
  } finally {
    await pool.end();
  }
}

populateDatabase();
