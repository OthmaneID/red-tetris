// Authentic arcade/retro Tetris color palette
export const TETRIS_COLORS: Record<string, string> = {
  0: "bg-neutral-900 border-neutral-800/60", // Empty cell
  I: "bg-cyan-500 border-cyan-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]",
  O: "bg-yellow-400 border-yellow-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]",
  T: "bg-purple-600 border-purple-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]",
  S: "bg-emerald-500 border-emerald-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]",
  Z: "bg-rose-500 border-rose-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]",
  J: "bg-blue-600 border-blue-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]",
  L: "bg-orange-500 border-orange-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]",
  G: "bg-neutral-600 border-neutral-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]", // Penalty / Gray indestructible row
};

export type BoardMatrix = (string | number)[][];
