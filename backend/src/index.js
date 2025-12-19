require("./config/env");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enables requests from React
app.use(express.json()); // Allows to read JSON body

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/library", libraryRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
