import { clsx } from "clsx";
import { toNumber } from "../../lib/metrics.js";

/**
 * Stepper v2 — tones stone/teal, même interface de props que Stepper v1.
 */
export function Stepper({ value, onChange, min = 0, step = 1, label, id, className }) {
  const n = toNumber(value, 0);

  const decrement = () => { onChange(Math.max(min, n - step)); vibrate(); };
  const increment = () => { onChange(n + step); vibrate(); };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 px-1 py-1 rounded-full",
        "border border-stone-200 bg-white shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={decrement}
        aria-label={`Réduire ${label ?? ""}`}
        className="w-9 h-9 flex items-center justify-center rounded-full
          text-stone-500 font-bold text-lg
          hover:bg-stone-100 active:scale-95
          transition-all duration-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
        className="w-12 text-center font-semibold text-stone-900 text-[15px]
          bg-transparent border-0 focus:outline-none
          [appearance:textfield]
          [&::-webkit-inner-spin-button]:appearance-none
          [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={increment}
        aria-label={`Augmenter ${label ?? ""}`}
        className="w-9 h-9 flex items-center justify-center rounded-full
          text-teal-600 font-bold text-lg
          hover:bg-teal-50 active:scale-95
          transition-all duration-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        +
      </button>
    </div>
  );
}

function vibrate() {
  try { navigator.vibrate?.(8); } catch {}
}
