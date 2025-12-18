const { Router } = require("express");

const gameController = require("../controllers/gameController");

const gameRouter = Router();

gameRouter.get("/", gameController.getAllGames);
gameRouter.post("/", gameController.postNewGame);
gameRouter.put("/:id", gameController.updateGame);
gameRouter.delete("/:id", gameController.deleteGame);

module.exports = gameRouter;
