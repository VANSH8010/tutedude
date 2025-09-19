import express from "express";
import dotenv from "dotenv";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import { exec } from "child_process";
import { writeFileSync } from "fs";
import path from "path";
import cors from "cors";
import videoRoutes from "./routes/videoRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Load environment variables
dotenv.config();

// Connect to DB
connectDB();

const app = express();
const port = process.env.PORT || 5000;

// HTTP server wrapper for socket.io
const server = createServer(app);

// ✅ socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      "https://ai-proctored-system.vercel.app",
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ socket.io connections
io.on("connection", (socket) => {
  console.log("✅ Interviewer connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Interviewer disconnected:", socket.id);
  });
});

// ✅ Export io for controllers (so we can emit cheating events)
export { io };

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "https://ai-proctored-system.vercel.app",
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ---------------------
// Code Execution Routes
// ---------------------

// Run Python code
app.post("/run-python", (req, res) => {
  const { code } = req.body;
  writeFileSync("script.py", code);

  exec("python script.py", (error, stdout, stderr) => {
    if (error) return res.send(`Error is: ${stderr}`);
    res.send(stdout);
  });
});

// Run JavaScript code
app.post("/run-javascript", (req, res) => {
  const { code } = req.body;
  writeFileSync("script.js", code);

  exec("node script.js", (error, stdout, stderr) => {
    if (error) return res.send(`Error: ${stderr}`);
    res.send(stdout);
  });
});

// Run Java code
app.post("/run-java", (req, res) => {
  const { code } = req.body;
  writeFileSync("Main.java", code);

  exec("javac Main.java && java Main", (error, stdout, stderr) => {
    if (error) return res.send(`Error: ${stderr}`);
    res.send(stdout);
  });
});

// ---------------------
// App Routes
// ---------------------
app.use("/api/users", userRoutes);
app.use("/api/users", examRoutes);
app.use("/api/users", resultRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/report", reportRoutes);

// ---------------------
// Production mode
// ---------------------
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("<h1>Server is running 🚀</h1>");
  });
}

// ---------------------
// Error handling
// ---------------------
app.use(notFound);
app.use(errorHandler);

// ---------------------
// Start server
// ---------------------
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
