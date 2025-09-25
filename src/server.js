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

// accessing static files in public folder
app.use(express.static("public"));

// Global Middlewares
globalMiddlewares(app);

// Connect to MongoDB
connectDB();

// Pages and auth routes middleware
app.use("/api", pageRoutes);
app.use("/auth", authRouter);
app.use("/api/bookings", bookingsRouter);

app.get("/", (req, res) => {
  res.render("index.ejs");
});

const samplePackages = [
  {
    title: "The Bali Package",
    days: 4,
    nights: 4,
    desc: "Experience the beauty of Bali with guided tours, beaches, and cultural sites.",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  },
  {
    title: "Swiss Alps Adventure",
    days: 6,
    nights: 5,
    desc: "Explore the Swiss Alps with scenic train rides and mountain hikes.",
    img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  },
  {
    title: "Maldives Escape",
    days: 5,
    nights: 4,
    desc: "Relax in the Maldives with luxury resorts and crystal-clear waters.",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  },
  {
    title: "Jaipur Heritage",
    days: 3,
    nights: 2,
    desc: "Discover Jaipur's palaces, forts, and vibrant markets.",
    img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  },
  {
    title: "Los Angeles Fun",
    days: 4,
    nights: 3,
    desc: "Enjoy the sights and sounds of LA, from Hollywood to Santa Monica.",
    img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
  },
  {
    title: "Bali Adventure",
    days: 7,
    nights: 6,
    desc: "A week-long adventure in Bali with surfing, temples, and food tours.",
    img: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368",
  },
  {
    title: "Paris Romance",
    days: 5,
    nights: 4,
    desc: "Romantic getaway in Paris with Seine cruises and Eiffel Tower views.",
    img: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b",
  },
  {
    title: "Tokyo Explorer",
    days: 6,
    nights: 5,
    desc: "Dive into Tokyo's culture, cuisine, and neon-lit nightlife.",
    img: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
  },
];

app.get("/packages", (req, res) => {
  res.render("packages", { packages: samplePackages });
});

// Socket.IO basic connection log
io.on("connection", (socket) => {
  console.log(chalk.green("WebSocket client connected:"), socket.id);
  socket.on("disconnect", () => {
    console.log(chalk.yellow("WebSocket client disconnected:"), socket.id);
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
