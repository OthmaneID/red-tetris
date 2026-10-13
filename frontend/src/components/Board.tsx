import { TETRIS_COLORS, type BoardMatrix } from "../constants/tetris.ts";

interface BoardProps {
  board: BoardMatrix;
  playerName: string;
  badgeLabel?: string;
  statusText: string;
  isStatusPositive?: boolean;
  isOpponent?: boolean;
}

export function Board({
  board,
  playerName,
  badgeLabel,
  statusText,
  isStatusPositive = true,
  isOpponent = false,
}: BoardProps) {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Player header */}
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isStatusPositive
                ? isOpponent
                  ? "bg-rose-500"
                  : "bg-emerald-500"
                : "bg-neutral-600"
            }`}
          />
          <span className="font-bold text-neutral-200 truncate">{playerName}</span>
          {badgeLabel && (
            <span className="text-[10px] text-neutral-500 shrink-0">({badgeLabel})</span>
          )}
        </div>
        <span
          className={`text-[10px] uppercase font-bold shrink-0 ${
            isStatusPositive
              ? isOpponent
                ? "text-rose-400"
                : "text-emerald-400"
              : "text-neutral-500"
          }`}
        >
          {statusText}
        </span>
      </div>

      {/* 10x20 Grid */}
      <div className="grid grid-cols-10 gap-0.5 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800/80">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const cellColorClass = isOpponent
              ? cell === 1
                ? "bg-neutral-600 border-neutral-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]"
                : TETRIS_COLORS[0]
              : TETRIS_COLORS[cell.toString()] || TETRIS_COLORS[0];

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-4 h-4 sm:w-6 sm:h-6 border rounded-xs transition-colors ${cellColorClass}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
