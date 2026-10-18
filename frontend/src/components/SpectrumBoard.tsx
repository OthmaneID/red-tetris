import { TETRIS_COLORS } from "../constants/tetris.ts";

const ROWS = 20;
const COLS = 10;

interface SpectrumBoardProps {
  spectrum: number[];
  playerName: string;
  isAlive: boolean;
}

export function SpectrumBoard({ spectrum, playerName, isAlive }: SpectrumBoardProps) {
  const heights = Array.from({ length: COLS }, (_, c) => spectrum[c] ?? 0);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isAlive ? "bg-rose-500" : "bg-neutral-600"
            }`}
          />
          <span className="font-bold text-neutral-200 truncate">{playerName}</span>
        </div>
        <span
          className={`text-[10px] uppercase font-bold shrink-0 ${
            isAlive ? "text-rose-400" : "text-neutral-500"
          }`}
        >
          {isAlive ? "Alive" : "K.O."}
        </span>
      </div>

      <div className="grid grid-cols-10 gap-0.5 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800/80">
        {Array.from({ length: ROWS }).map((_, r) =>
          heights.map((height, c) => {
            const filled = ROWS - r <= height;
            return (
              <div
                key={`${r}-${c}`}
                className={`w-3 h-3 sm:w-4 sm:h-4 border rounded-xs ${
                  filled ? TETRIS_COLORS.G : TETRIS_COLORS[0]
                }`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
