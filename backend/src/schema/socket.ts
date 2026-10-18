export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export type PlayerRole = "leader" | "player";

export type GameMode = "classic" | "invisible" | "gravity";

export interface Coordinates {
  x: number;
  y: number;
}

export interface PlayerInfo {
  id: string;
  username: string;
  role: PlayerRole;
  isAlive: boolean;
  score: number;
  spectrum: number[];
}

export interface RoomInfo {
  id: string;
  leaderId: string;
  isPlaying: boolean;
  mode: GameMode;
  players: PlayerInfo[];
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  lines: number;
  mode: GameMode;
  at: number;
}

export interface ClientToServerEvents {
  "room:join": (
    payload: { room: string; username: string },
    callback?: (response: { success: boolean; error?: string; room?: RoomInfo }) => void
  ) => void;
  "room:leave": () => void;
  "room:setMode": (payload: { mode: GameMode }) => void;

  "queue:join": (
    payload: { username: string },
    callback?: (response: { success: boolean; queued: boolean; error?: string }) => void
  ) => void;
  "queue:leave": () => void;

  "game:start": (
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  "game:requestPieces": (payload: { haveCount: number }) => void;
  "game:linesCleared": (payload: { count: number }) => void;
  "game:spectrum": (payload: { spectrum: number[] }) => void;
  "game:over": (payload: { score: number; lines: number }) => void;
}

export interface ServerToClientEvents {
  "room:updated": (room: RoomInfo) => void;
  "room:error": (error: { message: string }) => void;
  "queue:matched": (payload: { room: string; username: string }) => void;

  "game:started": (payload: { pieces: TetrominoType[]; mode: GameMode }) => void;
  "game:pieces": (payload: { pieces: TetrominoType[] }) => void;
  "game:penalty": (payload: { count: number; from: string }) => void;
  "game:spectrum": (payload: { playerId: string; username: string; spectrum: number[] }) => void;
  "game:eliminated": (payload: { playerId: string; username: string }) => void;
  "game:ended": (payload: { winnerId: string | null; winnerUsername: string | null }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  username?: string;
  roomId?: string;
}
