require("../config/env");
const fs = require("fs");
const path = require("path");

const pool = require("../config/db");

async function dropDatabase() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, "sql/drop.sql"), "utf-8");

    console.log("Dropping database...");
    await pool.query(sql);
    console.log("Database dropped successfully!");
  } catch (error) {
    console.error("Error dropping database tables:", error);
  } finally {
    await pool.end();
  }
}

dropDatabase();
