import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import path from "path";
import greet from "bhaveshtest";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { setIO } from "../config/socket.js";

import { fileURLToPath } from "url";

import connectDB from "../config/db.js";
import pageRoutes from "./page routes/pages.js";
import globalMiddlewares from "./Middlewares/golbalMiddlewares.js";
import authRouter from "./routes/auth.js";
import bookingsRouter from "./routes/bookings.js";
import contactRouter from "./routes/contact.js";
import packagesRouter from "./routes/packages.js";
import stayOnlyRouter from "./routes/stayOnly.js";
import Package from "../models/package.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
});
setIO(io);
const PORT = process.env.PORT || 6969;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the templating engine
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

app.use(express.static("public", {
  maxAge: 120000, // 2 minutes in milliseconds
  etag: true, 
  lastModified: true,
  setHeaders: (res, path) => {
    // Optional: explicitly enforce 2-min cache
    if (path.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/)) {
      res.setHeader("Cache-Control", "public, max-age=120");
    }
  }
}));


// Global Middlewares
globalMiddlewares(app);

// Connect to MongoDB
connectDB();

// Pages and auth routes middleware
app.use("/api", pageRoutes);
app.use("/auth", authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/stay-only", stayOnlyRouter);

app.get("/", async (req, res) => {
  try {
    const packages = await Package.find({}).limit(3).lean();
    res.render("index.ejs", { packages });
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.render("index.ejs", { packages: [] });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(chalk.green("WebSocket client connected:"), socket.id);
  
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(chalk.yellow("WebSocket client disconnected:"), socket.id);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(chalk.red("WebSocket error:"), error);
  });

  // Optional: Send connection confirmation
  socket.emit("connected", { 
    message: "Connected to Palm Ways server",
    socketId: socket.id 
  });
});

console.log(greet());

server.listen(PORT, () => {
  console.log(chalk.blue(`Server is running on port ${PORT} 🚀`));
});

//Handle undefined routes and errors
app.use((req, res, next) => {
  res.status(404).render("error.ejs", {
    errorCode: 404,
    errorMessage: "The page you are looking for does not exist.",
  });
});

app.use((err, req, res, next) => {
  console.log(err.message);
  console.error(err.stack);
  res.status(500).render("error.ejs", {
    errorCode: 500,
    errorMessage: "An unexpected error occurred.",
  });
});
