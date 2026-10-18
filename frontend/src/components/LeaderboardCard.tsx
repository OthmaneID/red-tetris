import type { LeaderboardEntry } from "../types/socket.ts";

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardCard({ entries }: LeaderboardCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h2 className="text-xs uppercase text-neutral-500 font-bold tracking-widest mb-3">
        Leaderboard
      </h2>
      {entries.length === 0 ? (
        <p className="text-xs text-neutral-500">No scores recorded yet.</p>
      ) : (
        <ol className="space-y-1">
          {entries.map((entry, index) => (
            <li
              key={`${entry.username}-${entry.at}`}
              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-950/50 border border-neutral-800/40"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-neutral-500 w-4">{index + 1}.</span>
                <span className="text-neutral-200 truncate">{entry.username}</span>
                <span className="text-[10px] text-neutral-600 uppercase">{entry.mode}</span>
              </span>
              <span className="font-bold text-amber-400 shrink-0">{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
