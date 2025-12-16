const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const gameRoutes = require("./routes/gameRoutes"); // убрали .js

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enables requests from React
app.use(express.json()); // Allows to read JSON body

// Routes
app.use("/api/games", gameRoutes);

app.get("/", (req, res) => {
  res.send("Game Library API is running...");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
