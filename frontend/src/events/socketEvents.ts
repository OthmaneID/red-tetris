import { socket } from "../socket.ts";
import type { GameMode, RoomInfo, TetrominoType } from "../types/socket.ts";

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
  onRoomUpdated?: (room: RoomInfo) => void;
  onRoomError?: (error: { message: string }) => void;
  onQueueMatched?: (payload: { room: string; username: string }) => void;
  onGameStarted?: (payload: { pieces: TetrominoType[]; mode: GameMode }) => void;
  onPieces?: (payload: { pieces: TetrominoType[] }) => void;
  onPenalty?: (payload: { count: number; from: string }) => void;
  onSpectrum?: (payload: { playerId: string; username: string; spectrum: number[] }) => void;
  onEliminated?: (payload: { playerId: string; username: string }) => void;
  onEnded?: (payload: { winnerId: string | null; winnerUsername: string | null }) => void;
}

export function registerSocketListeners(handlers: SocketEventHandlers): () => void {
  const {
    onConnect,
    onDisconnect,
    onConnectError,
    onRoomUpdated,
    onRoomError,
    onQueueMatched,
    onGameStarted,
    onPieces,
    onPenalty,
    onSpectrum,
    onEliminated,
    onEnded,
  } = handlers;

  if (onConnect) socket.on("connect", onConnect);
  if (onDisconnect) socket.on("disconnect", onDisconnect);
  if (onConnectError) socket.on("connect_error", onConnectError);
  if (onRoomUpdated) socket.on("room:updated", onRoomUpdated);
  if (onRoomError) socket.on("room:error", onRoomError);
  if (onQueueMatched) socket.on("queue:matched", onQueueMatched);
  if (onGameStarted) socket.on("game:started", onGameStarted);
  if (onPieces) socket.on("game:pieces", onPieces);
  if (onPenalty) socket.on("game:penalty", onPenalty);
  if (onSpectrum) socket.on("game:spectrum", onSpectrum);
  if (onEliminated) socket.on("game:eliminated", onEliminated);
  if (onEnded) socket.on("game:ended", onEnded);

  return () => {
    if (onConnect) socket.off("connect", onConnect);
    if (onDisconnect) socket.off("disconnect", onDisconnect);
    if (onConnectError) socket.off("connect_error", onConnectError);
    if (onRoomUpdated) socket.off("room:updated", onRoomUpdated);
    if (onRoomError) socket.off("room:error", onRoomError);
    if (onQueueMatched) socket.off("queue:matched", onQueueMatched);
    if (onGameStarted) socket.off("game:started", onGameStarted);
    if (onPieces) socket.off("game:pieces", onPieces);
    if (onPenalty) socket.off("game:penalty", onPenalty);
    if (onSpectrum) socket.off("game:spectrum", onSpectrum);
    if (onEliminated) socket.off("game:eliminated", onEliminated);
    if (onEnded) socket.off("game:ended", onEnded);
  };
}

export const socketEmitters = {
  joinRoom: (
    payload: { room: string; username: string },
    callback?: (response: { success: boolean; error?: string; room?: RoomInfo }) => void
  ) => socket.emit("room:join", payload, callback),

  leaveRoom: () => socket.emit("room:leave"),

  setMode: (mode: GameMode) => socket.emit("room:setMode", { mode }),

  joinQueue: (
    payload: { username: string },
    callback?: (response: { success: boolean; queued: boolean; error?: string }) => void
  ) => socket.emit("queue:join", payload, callback),

  leaveQueue: () => socket.emit("queue:leave"),

  startGame: (callback?: (response: { success: boolean; error?: string }) => void) =>
    socket.emit("game:start", callback),

  requestPieces: (consumed: number) => socket.emit("game:requestPieces", { haveCount: consumed }),

  sendLinesCleared: (count: number) => socket.emit("game:linesCleared", { count }),

  sendSpectrum: (spectrum: number[]) => socket.emit("game:spectrum", { spectrum }),

  sendGameOver: (score: number, lines: number) => socket.emit("game:over", { score, lines }),
};
