// ==========================================
// RED TETRIS - SOCKET.IO TYPE CONTRACTS
// ==========================================

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export interface Coordinates {
  x: number;
  y: number;
}

export type PlayerRole = "leader" | "player";

export interface PlayerInfo {
  id: string; // Socket ID
  username: string;
  role: PlayerRole;
  isReady: boolean;
  isAlive: boolean;
  score: number;
  spectrum: number[][]; // 2D array representation of board / shadow spectrum
}

export interface RoomInfo {
  id: string; // Room name / ID from URL hash (#room[player])
  leaderId: string;
  isPlaying: boolean;
  players: PlayerInfo[];
}

// ------------------------------------------
// CLIENT -> SERVER EVENTS
// ------------------------------------------
export interface ClientToServerEvents {
  // Room lifecycle
  "room:join": (
    payload: { room: string; username: string },
    callback?: (response: { success: boolean; error?: string; room?: RoomInfo }) => void
  ) => void;
  "room:leave": () => void;
  "game:start": () => void;

  // In-game actions
  "game:move": (payload: { direction: "left" | "right" | "down" }) => void;
  "game:rotate": () => void;
  "game:hardDrop": () => void;
  "game:boardUpdate": (payload: { spectrum: number[][] }) => void;
  "game:linesCleared": (payload: { count: number }) => void; // Generates penalty lines for opponents
  "game:over": () => void;
}

// ------------------------------------------
// SERVER -> CLIENT EVENTS
// ------------------------------------------
export interface ServerToClientEvents {
  // Room updates
  "room:updated": (room: RoomInfo) => void;
  "room:error": (error: { message: string }) => void;

  // Game state & piece stream
  "game:started": (payload: { initialPieces: TetrominoType[] }) => void;
  "game:pieceStream": (pieces: TetrominoType[]) => void; // Synchronized piece sequence for all players
  "game:penaltyLines": (payload: { count: number; fromPlayer: string }) => void; // Indestructible bottom rows added
  "game:opponentSpectrum": (payload: { playerId: string; spectrum: number[][] }) => void;
  "game:playerEliminated": (payload: { playerId: string; username: string }) => void;
  "game:ended": (payload: { winnerId: string; winnerUsername: string }) => void;
}

// ------------------------------------------
// INTER-SERVER & SOCKET DATA
// ------------------------------------------
export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  username?: string;
  roomId?: string;
}
