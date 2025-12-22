require("../../config/env");
const fs = require("fs");
const path = require("path");

const pool = require("../../config/db");

async function initDatabase() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "../sql/init_v2.sql"),
      "utf-8"
    );

    console.log("Initializing database...");
    await pool.query(sql);
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    await pool.end();
  }
}

initDatabase();
