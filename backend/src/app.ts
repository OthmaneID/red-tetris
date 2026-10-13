import express, { NextFunction, type Application, type Request, type Response } from "express";
import dotenv from "dotenv";
import cors from "cors"
import authRouter from "./routes/auth.ts";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./sockets/index.ts";

dotenv.config();

const app: Application = express();

const PORT = process.env.BACKEND_PORT || 8000;

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"]

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};
// for cors
app.use(cors(corsOptions))
// for parsing the body of a request
app.use(express.json())

//  just for fun
app.use((req:Request, response:Response, next: NextFunction) => {
    console.log("INFO: " + req.method + " " + req.path)
    next()
})

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/auth",authRouter);

const httpServer = createServer(app);

// Attach Socket.io to the HTTP server with CORS configured
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register all socket event handlers
registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server & WebSockets listening on port ${PORT}`);
});
