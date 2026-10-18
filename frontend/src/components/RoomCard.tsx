import type { GameMode, PlayerInfo } from "../types/socket.ts";
import { ModeSelector } from "./ModeSelector.tsx";

interface RoomCardProps {
  room: string;
  username: string;
  players?: PlayerInfo[];
  errorMessage?: string | null;
  isQueuing?: boolean;
  isPlaying?: boolean;
  isLeader?: boolean;
  mode: GameMode;
  onStartGame?: () => void;
  onSetMode?: (mode: GameMode) => void;
  onJoinQueue?: () => void;
  onLeaveQueue?: () => void;
}

export function RoomCard({
  room,
  username,
  players = [],
  errorMessage,
  isQueuing = false,
  isPlaying = false,
  isLeader = false,
  mode,
  onStartGame,
  onSetMode,
  onJoinQueue,
  onLeaveQueue,
}: RoomCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase text-neutral-500 font-bold tracking-widest">
          Multiplayer Match
        </h2>
        <span className="text-[10px] text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded">
          {players.length} {players.length === 1 ? "player" : "players"}
        </span>
      </div>

      {errorMessage && (
        <div className="p-2 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
          {errorMessage}
        </div>
      )}

      <div className="p-2.5 rounded bg-neutral-950/70 border border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isQueuing ? "bg-amber-400 animate-ping" : "bg-cyan-400"
              }`}
            />
            Matchmaking
          </span>
          <span className="text-[10px] text-neutral-500">Auto Pair</span>
        </div>

        {isQueuing ? (
          <div className="space-y-1.5">
            <div className="text-xs text-amber-300 flex items-center justify-between">
              <span>Searching for opponent...</span>
              <span className="animate-pulse">⏳</span>
            </div>
            <button
              type="button"
              onClick={onLeaveQueue}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-1.5 px-3 rounded text-xs transition-colors cursor-pointer border border-neutral-700"
            >
              Cancel Matchmaking
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onJoinQueue}
            className="w-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors cursor-pointer border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          >
            Find Match
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
          <span className="text-neutral-400">Room</span>
          <span className="font-bold text-neutral-200">#{room}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-neutral-400">Player</span>
          <span className="font-bold text-rose-400">
            {username} {isLeader && <span className="text-[10px] text-amber-400">(Leader)</span>}
          </span>
        </div>
      </div>

      {players.length > 0 && (
        <div className="pt-2 border-t border-neutral-800/60">
          <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest mb-1.5">
            Connected Players
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-950/50 border border-neutral-800/40"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      p.isAlive ? "bg-emerald-400" : "bg-neutral-500"
                    }`}
                  />
                  <span
                    className={`truncate ${
                      p.username === username ? "text-rose-400 font-bold" : "text-neutral-300"
                    }`}
                  >
                    {p.username}
                    {p.role === "leader" && <span className="text-amber-400"> ★</span>}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  {p.isAlive ? "Ready" : "K.O."}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLeader && !isPlaying && onSetMode && (
        <ModeSelector value={mode} onChange={onSetMode} />
      )}

      {isLeader ? (
        <button
          type="button"
          onClick={onStartGame}
          className="mt-1 w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors cursor-pointer border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
        >
          {isPlaying ? "Restart Match" : "Start Game"}
        </button>
      ) : (
        <div className="mt-1 w-full bg-neutral-950 border border-neutral-800 text-neutral-500 font-bold py-2 px-3 rounded text-xs text-center">
          Waiting for leader to start ({mode})
        </div>
      )}
    </div>
  );
}
