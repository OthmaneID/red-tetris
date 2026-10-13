interface RoomCardProps {
  room: string;
  username: string;
  isLeader?: boolean;
  onStartGame?: () => void;
}

export function RoomCard({
  room,
  username,
  isLeader = true,
  onStartGame,
}: RoomCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h2 className="text-xs uppercase text-neutral-500 font-bold tracking-widest mb-3">
        Room Details
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
          <span className="text-neutral-400">Room</span>
          <span className="font-bold text-neutral-200">#{room}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
          <span className="text-neutral-400">Player</span>
          <span className="font-bold text-rose-400">{username}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-neutral-400">Role</span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-bold border ${
              isLeader
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-blue-500/20 text-blue-300 border-blue-500/30"
            }`}
          >
            {isLeader ? "Leader" : "Player"}
          </span>
        </div>
      </div>

      {isLeader && (
        <button
          type="button"
          onClick={onStartGame}
          className="mt-4 w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors cursor-pointer border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
        >
          Start Game
        </button>
      )}
    </div>
  );
}
