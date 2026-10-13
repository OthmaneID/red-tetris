export function ControlsCard() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs text-neutral-400 space-y-1.5">
      <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest mb-2">
        Controls
      </div>
      <div className="flex justify-between">
        <span>← / →</span>
        <span className="text-neutral-300">Move Left / Right</span>
      </div>
      <div className="flex justify-between">
        <span>↑</span>
        <span className="text-neutral-300">Rotate</span>
      </div>
      <div className="flex justify-between">
        <span>↓</span>
        <span className="text-neutral-300">Soft Drop</span>
      </div>
      <div className="flex justify-between">
        <span>Space</span>
        <span className="text-neutral-300">Hard Drop</span>
      </div>
    </div>
  );
}
