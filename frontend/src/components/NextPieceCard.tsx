import { TETRIS_COLORS } from "../constants/tetris.ts";

interface NextPieceProps {
  type?: "I" | "J" | "L" | "O" | "S" | "T" | "Z";
}

// 4x2 representation for tetromino previews
const PIECE_SHAPES: Record<string, number[][]> = {
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
  ],
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
  ],
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
  ],
};

export function NextPieceCard({ type = "T" }: NextPieceProps) {
  const shape = PIECE_SHAPES[type] || PIECE_SHAPES.T;
  const colorClass = TETRIS_COLORS[type] || TETRIS_COLORS.T;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h2 className="text-xs uppercase text-neutral-500 font-bold tracking-widest mb-3">
        Next Piece
      </h2>
      <div className="bg-neutral-950 border border-neutral-800 rounded p-3 flex items-center justify-center min-h-24">
        <div className="grid grid-cols-4 gap-1">
          {shape.map((row, rIdx) =>
            row.map((filled, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-5 h-5 rounded-xs transition-colors ${
                  filled === 1 ? colorClass : "bg-neutral-900/50"
                }`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
