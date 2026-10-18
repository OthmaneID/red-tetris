import express, { type Application, type Request, type Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./sockets/index.ts";
import { leaderboard } from "./game/leaderboard.ts";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app: Application = express();

const PORT = process.env.BACKEND_PORT || 8000;
const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/leaderboard", (_req: Request, res: Response) => {
  res.json({ entries: leaderboard.top(10) });
});

const clientDist = join(__dirname, "../../frontend/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/.*/, (_req: Request, res: Response) => {
    res.sendFile(join(clientDist, "index.html"));
  });
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Red Tetris server & WebSockets listening on port ${PORT}`);
});

export { app, httpServer, io };
