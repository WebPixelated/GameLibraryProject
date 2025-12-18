const express = require("express");
const authRouter = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", authenticate, authController.getProfile);

module.exports = authRouter;
