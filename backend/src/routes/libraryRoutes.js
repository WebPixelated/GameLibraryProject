const express = require("express");
const libraryRouter = express.Router();
const libraryController = require("../controllers/libraryController");
const { authenticate } = require("../middleware/auth");

// All routes should require authentication
libraryRouter.use(authenticate);

// Static routes before dynamic ones
libraryRouter.get("/search", libraryController.searchGames);
libraryRouter.get("/stats", libraryController.getStats);
libraryRouter.get("/dashboard", libraryController.getDashboard);

// Steam import
libraryRouter.post("/import/steam", libraryController.importFromSteam);

// CRUD
libraryRouter.get("/", libraryController.getLibrary);
libraryRouter.post("/", libraryController.addGame);
libraryRouter.get("/:id", libraryController.getGame);
libraryRouter.put("/:id", libraryController.updateGame);
libraryRouter.delete("/:id", libraryController.deleteGame);

module.exports = libraryRouter;
