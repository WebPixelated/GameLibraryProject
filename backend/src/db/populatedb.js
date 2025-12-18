const fs = require("fs");
const path = require("path");

const pool = require("../config/db");

async function dropDatabase() {
  try {
    const populateSql = fs.readFileSync(
      path.join(__dirname, "sql/populate.sql"),
      "utf-8"
    );

    console.log("Populating initial data...");
    await pool.query(populateSql);
    console.log("Initial data populated successfully!");

    // Verify inserted data
    const users = await pool.query("SELECT * FROM users;");
    const games = await pool.query("SELECT * FROM games;");
    const user_games = await pool.query("SELECT * FROM user_games;");
    const activity_log = await pool.query("SELECT * FROM activity_log;");

    console.log("Users:", users.rows.length);
    console.log("Games:", games.rows.length);
    console.log("User Games:", user_games.rows.length);
    console.log("Activity Log:", activity_log.rows.length);
  } catch (error) {
    console.error("Error populating database:", error);
  } finally {
    await pool.end();
  }
}

dropDatabase();
