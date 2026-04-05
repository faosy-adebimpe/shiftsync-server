require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/database");
const routes = require("./routes");
const socketHandler = require("./services/socketService");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use("/api", routes);

// Socket.io
const socketService = socketHandler(io);
app.set("socketService", socketService);

// Database sync
async function initDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced");
  } catch (err) {
    console.error("Database alter failed:", err);
    console.log("Retrying database sync with force...");
    await sequelize.sync({ force: true });
    console.log("Database synced with force.");
  }

  if (process.env.NODE_ENV === "development") {
    const seedDatabase = require("./database/seed");
    await seedDatabase();
  }
}

initDatabase().catch((err) => {
  console.error("Database initialization error:", err);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
