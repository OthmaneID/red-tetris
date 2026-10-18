import type { GameMode } from "../types/socket.ts";

const MODES: { id: GameMode; label: string; hint: string }[] = [
  { id: "classic", label: "Classic", hint: "Standard rules" },
  { id: "invisible", label: "Invisible", hint: "Placed blocks hidden" },
  { id: "gravity", label: "Gravity+", hint: "Faster falling" },
];

interface ModeSelectorProps {
  value: GameMode;
  disabled?: boolean;
  onChange: (mode: GameMode) => void;
}

export function ModeSelector({ value, disabled = false, onChange }: ModeSelectorProps) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">
        Game Mode
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            title={m.hint}
            onClick={() => onChange(m.id)}
            className={`py-1.5 px-1 rounded text-[11px] font-bold transition-colors border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              value === m.id
                ? "bg-rose-600 border-rose-500 text-white"
                : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
