import { clsx } from "clsx";
import { toNumber } from "../../lib/metrics.js";

export function Stepper({ value, onChange, min = 0, step = 1, label, id, className }) {
  const n = toNumber(value, 0);

  const decrement = () => {
    const next = Math.max(min, n - step);
    onChange(next);
    vibrate();
  };
  const increment = () => {
    onChange(n + step);
    vibrate();
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full",
        "border border-slate-200 bg-gradient-to-b from-slate-50 to-white",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
        className
      )}
    >
      <button
        type="button"
        onClick={decrement}
        aria-label={`Réduire ${label || ""}`}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white
          text-slate-700 font-bold text-lg shadow-sm border border-slate-100
          hover:bg-slate-50 active:scale-95 transition-all duration-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={n}
        onChange={e => onChange(Math.max(min, toNumber(e.target.value, n)))}
        aria-label={label}
        className="w-12 text-center font-bold text-slate-800 bg-transparent border-0
          focus:outline-none [appearance:textfield]
          [&::-webkit-inner-spin-button]:appearance-none
          [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={increment}
        aria-label={`Augmenter ${label || ""}`}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white
          text-emerald-600 font-bold text-lg shadow-sm border border-slate-100
          hover:bg-emerald-50 active:scale-95 transition-all duration-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        +
      </button>
    </div>
  );
}

function vibrate() {
  try { navigator.vibrate?.(8); } catch {}
}
