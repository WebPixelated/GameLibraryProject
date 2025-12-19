require("./config/env");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enables requests from React
app.use(express.json()); // Allows to read JSON body

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Game Library API is running...");
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
