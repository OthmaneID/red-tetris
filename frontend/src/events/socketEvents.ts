import { socket } from "../socket.ts";
import type {
  RoomInfo,
  TetrominoType,
} from "../types/socket.ts";

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
  onRoomUpdated?: (room: RoomInfo) => void;
  onRoomError?: (error: { message: string }) => void;
  onGameStarted?: (payload: { initialPieces: TetrominoType[] }) => void;
  onPieceStream?: (pieces: TetrominoType[]) => void;
  onPenaltyLines?: (payload: { count: number; fromPlayer: string }) => void;
  onOpponentSpectrum?: (payload: { playerId: string; spectrum: number[][] }) => void;
  onPlayerEliminated?: (payload: { playerId: string; username: string }) => void;
  onGameEnded?: (payload: { winnerId: string; winnerUsername: string }) => void;
}

/**
 * Registers incoming socket listeners from the server.
 * Returns an unsubscribe cleanup function to be called on unmount.
 */
export function registerSocketListeners(handlers: SocketEventHandlers): () => void {
  const {
    onConnect,
    onDisconnect,
    onConnectError,
    onRoomUpdated,
    onRoomError,
    onGameStarted,
    onPieceStream,
    onPenaltyLines,
    onOpponentSpectrum,
    onPlayerEliminated,
    onGameEnded,
  } = handlers;

  if (onConnect) socket.on("connect", onConnect);
  if (onDisconnect) socket.on("disconnect", onDisconnect);
  if (onConnectError) socket.on("connect_error", onConnectError);
  if (onRoomUpdated) socket.on("room:updated", onRoomUpdated);
  if (onRoomError) socket.on("room:error", onRoomError);
  if (onGameStarted) socket.on("game:started", onGameStarted);
  if (onPieceStream) socket.on("game:pieceStream", onPieceStream);
  if (onPenaltyLines) socket.on("game:penaltyLines", onPenaltyLines);
  if (onOpponentSpectrum) socket.on("game:opponentSpectrum", onOpponentSpectrum);
  if (onPlayerEliminated) socket.on("game:playerEliminated", onPlayerEliminated);
  if (onGameEnded) socket.on("game:ended", onGameEnded);

  return () => {
    if (onConnect) socket.off("connect", onConnect);
    if (onDisconnect) socket.off("disconnect", onDisconnect);
    if (onConnectError) socket.off("connect_error", onConnectError);
    if (onRoomUpdated) socket.off("room:updated", onRoomUpdated);
    if (onRoomError) socket.off("room:error", onRoomError);
    if (onGameStarted) socket.off("game:started", onGameStarted);
    if (onPieceStream) socket.off("game:pieceStream", onPieceStream);
    if (onPenaltyLines) socket.off("game:penaltyLines", onPenaltyLines);
    if (onOpponentSpectrum) socket.off("game:opponentSpectrum", onOpponentSpectrum);
    if (onPlayerEliminated) socket.off("game:playerEliminated", onPlayerEliminated);
    if (onGameEnded) socket.off("game:ended", onGameEnded);
  };
}

// ==========================================
// OUTGOING EMIT HELPERS
// ==========================================

export const socketEmitters = {
  joinRoom: (
    payload: { room: string; username: string },
    callback?: (response: { success: boolean; error?: string; room?: RoomInfo }) => void
  ) => {
    socket.emit("room:join", payload, callback);
  },

  leaveRoom: () => {
    socket.emit("room:leave");
  },

  startGame: () => {
    socket.emit("game:start");
  },

  sendMove: (direction: "left" | "right" | "down") => {
    socket.emit("game:move", { direction });
  },

  sendRotate: () => {
    socket.emit("game:rotate");
  },

  sendHardDrop: () => {
    socket.emit("game:hardDrop");
  },

  sendBoardUpdate: (spectrum: number[][]) => {
    socket.emit("game:boardUpdate", { spectrum });
  },

  sendLinesCleared: (count: number) => {
    socket.emit("game:linesCleared", { count });
  },

  sendGameOver: () => {
    socket.emit("game:over");
  },
};
