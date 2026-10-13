interface HeaderProps {
  room: string;
  username: string;
  isConnected: boolean;
  socketId: string | null;
  gameMode: "Solo" | "Multiplayer";
  onToggleMode: (mode: "Solo" | "Multiplayer") => void;
}

export function Header({
  room,
  username,
  isConnected,
  socketId,
  gameMode,
  onToggleMode,
}: HeaderProps) {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded bg-rose-500 flex items-center justify-center font-black text-xs text-neutral-950">
          R
        </div>
        <span className="font-black text-lg tracking-wider text-neutral-100">
          RED<span className="text-rose-500">TETRIS</span>
        </span>
        {gameMode === "Multiplayer" ? (
          <span className="text-xs text-neutral-500 border border-neutral-800 px-2 py-0.5 rounded hidden sm:inline">
            #{room}[{username}]
          </span>
        ) : (
          <span className="text-xs text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded hidden sm:inline">
            Singleplayer
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Game Mode Selector */}
        <div className="flex bg-neutral-950 p-0.5 rounded-md border border-neutral-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => onToggleMode("Solo")}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              gameMode === "Solo"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Solo
          </button>
          <button
            type="button"
            onClick={() => onToggleMode("Multiplayer")}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              gameMode === "Multiplayer"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Multiplayer
          </button>
        </div>

        {/* Socket Status Beacon (shown in multiplayer or general connectivity) */}
        <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
            }`}
          />
          <span className="text-xs uppercase tracking-wider text-neutral-400 hidden md:inline">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          {socketId && gameMode === "Multiplayer" && (
            <span className="text-xs text-neutral-600 hidden lg:inline">
              ({socketId.slice(0, 6)})
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
