import { clsx } from "clsx";

// Color track based on value vs thresholds (green → orange → red)
function trackColor(value, redThreshold, orangeThreshold, isLower = false) {
  if (!redThreshold && !orangeThreshold) return "#10b981"; // emerald default
  const n = Number(value);
  if (isLower) {
    if (n <= redThreshold) return "#ef4444";
    if (n <= orangeThreshold) return "#f59e0b";
    return "#10b981";
  }
  if (n >= redThreshold) return "#ef4444";
  if (n >= orangeThreshold) return "#f59e0b";
  return "#10b981";
}

export function SliderField({
  id, label, value, onChange,
  min = 0, max = 10, step = 1,
  redThreshold, orangeThreshold, lowerIsBad = false,
  className,
}) {
  const pct = ((Number(value) - min) / (max - min)) * 100;
  const color = trackColor(value, redThreshold, orangeThreshold, lowerIsBad);

  return (
    <div className={clsx("rounded-xl bg-slate-50 border border-slate-100 p-3", className)}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700 cursor-pointer">
          {label}
        </label>
        <span
          className="text-base font-bold tabular-nums min-w-[2rem] text-right"
          style={{ color }}
          aria-live="polite"
        >
          {value}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* track fill */}
        <div
          className="absolute h-1.5 rounded-full pointer-events-none"
          style={{ width: `${pct}%`, background: color, transition: "width 100ms, background 200ms" }}
        />
        {/* track bg */}
        <div className="absolute w-full h-1.5 rounded-full bg-slate-200 -z-10" />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-6 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100
            [&::-webkit-slider-thumb]:active:scale-110
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:shadow-md"
          style={{ "--thumb-color": color }}
          aria-label={label}
        />
      </div>
    </div>
  );
}
