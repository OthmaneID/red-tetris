import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types/socket.ts";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : window.location.origin);

export const socket: TypedSocket = io(SERVER_URL, {
  autoConnect: true,
  withCredentials: true,
});
