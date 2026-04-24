import { clsx } from "clsx";

/**
 * GradientSlider v2 — "calme clinique"
 *
 * Track : dégradé fixe sage → stone-neutre → terracotta (jamais de rouge vif).
 * Affiche la valeur + un label humanisé (Aucune / Légère / Modérée / Forte / Intense).
 * Conserve la compatibilité de props avec SliderField v1 (id, label, value, onChange, min, max, step).
 */

const DEFAULT_LABELS = [
  { upTo: 1,  text: "Aucune"  },
  { upTo: 3,  text: "Légère"  },
  { upTo: 5,  text: "Modérée" },
  { upTo: 7,  text: "Forte"   },
  { upTo: 10, text: "Intense" },
];

function getLabel(value, labels = DEFAULT_LABELS) {
  for (const entry of labels) {
    if (Number(value) <= entry.upTo) return entry.text;
  }
  return labels[labels.length - 1]?.text ?? "";
}

export function GradientSlider({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  valueLabels,        // override DEFAULT_LABELS
  showValueLabel = true,
  scaleLabels,        // e.g. ["Aucune", "Modérée", "Intense"] — under the track
  className,
}) {
  const pct = ((Number(value) - min) / (max - min)) * 100;
  const humanLabel = showValueLabel ? getLabel(value, valueLabels ?? DEFAULT_LABELS) : null;

  return (
    <div className={clsx("space-y-2", className)}>
      {/* Label row */}
      <div className="flex items-baseline justify-between gap-2">
        {label && (
          <label
            htmlFor={id}
            className="text-[11px] font-bold text-stone-400 uppercase tracking-widest cursor-pointer"
          >
            {label}
          </label>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-fraunces font-semibold text-stone-900 tabular-nums leading-none">
            {value}
          </span>
          <span className="text-sm text-stone-400">/ {max}</span>
          {humanLabel && (
            <span className="text-sm font-medium text-stone-500">{humanLabel}</span>
          )}
        </div>
      </div>

      {/* Slider + gradient track */}
      <div className="relative h-8 flex items-center">
        {/* Gradient track */}
        <div
          className="absolute inset-x-0 h-2.5 rounded-full pointer-events-none slider-gradient-track"
          aria-hidden
        />
        {/* Position indicator overlay (white fade after thumb) */}
        <div
          className="absolute right-0 h-2.5 rounded-full pointer-events-none bg-white/50"
          style={{ width: `${100 - pct}%`, transition: "width 80ms" }}
          aria-hidden
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          className={[
            "relative w-full h-8 appearance-none bg-transparent cursor-pointer z-10",
            // Webkit thumb
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-white",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-stone-300",
            "[&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
            "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100",
            "[&::-webkit-slider-thumb]:active:scale-110",
            // Moz thumb
            "[&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6",
            "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white",
            "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-stone-300",
            "[&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
          ].join(" ")}
        />
      </div>

      {/* Optional scale labels */}
      {scaleLabels?.length > 0 && (
        <div className="flex justify-between px-0.5">
          {scaleLabels.map(l => (
            <span key={l} className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
