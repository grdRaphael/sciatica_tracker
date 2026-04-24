import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Sparkline } from "../ui/Sparkline.jsx"; // réutilise le composant SVG existant

/**
 * MetricCard v2 — espacement généreux, chiffre en Fraunces, teal accent.
 */
export function MetricCard({ label, value, unit, sparkData = [], sparkColor = "#3D9B8E", trend, className }) {
  const trendEl =
    trend === "up"   ? <TrendingUp  size={14} className="text-teal-500"    aria-hidden /> :
    trend === "down" ? <TrendingDown size={14} className="text-chaleur-500" aria-hidden /> :
    trend === "flat" ? <Minus        size={14} className="text-stone-400"   aria-hidden /> :
    null;

  return (
    <div className={`bg-white rounded-2xl border border-stone-200/70 shadow-card p-4 flex flex-col gap-2 ${className ?? ""}`}>
      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest leading-none">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-fraunces font-semibold text-stone-900 tabular-nums leading-none">{value}</span>
        {unit && <span className="text-sm text-stone-400 mb-0.5">{unit}</span>}
        {trendEl && <span className="mb-0.5 ml-auto">{trendEl}</span>}
      </div>
      {sparkData.length > 1 && (
        <Sparkline data={sparkData} color={sparkColor} height={28} />
      )}
    </div>
  );
}
