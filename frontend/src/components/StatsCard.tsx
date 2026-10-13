interface StatsCardProps {
  score: number;
  lines: number;
  level: number;
}

export function StatsCard({ score, lines, level }: StatsCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <h2 className="text-xs uppercase text-neutral-500 font-bold tracking-widest mb-3">
        Statistics
      </h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-neutral-950 border border-neutral-800 rounded p-2">
          <div className="text-[10px] text-neutral-500 uppercase">Score</div>
          <div className="text-base font-black text-amber-400">{score}</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded p-2">
          <div className="text-[10px] text-neutral-500 uppercase">Lines</div>
          <div className="text-base font-black text-cyan-400">{lines}</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded p-2">
          <div className="text-[10px] text-neutral-500 uppercase">Level</div>
          <div className="text-base font-black text-purple-400">{level}</div>
        </div>
      </div>
    </div>
  );
}
