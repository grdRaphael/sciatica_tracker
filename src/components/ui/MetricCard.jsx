import { clsx } from "clsx";
import { Sparkline } from "./Sparkline.jsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function TrendArrow({ trend }) {
  if (trend === "up") return <TrendingUp size={14} className="text-emerald-500" aria-hidden />;
  if (trend === "down") return <TrendingDown size={14} className="text-red-400" aria-hidden />;
  return <Minus size={14} className="text-slate-400" aria-hidden />;
}

export function MetricCard({ label, value, unit = "", sparkData = [], sparkColor = "#10b981", trend, className }) {
  return (
    <div className={clsx(
      "bg-white rounded-2xl border border-slate-200/70 shadow-card p-4 flex flex-col gap-2",
      className
    )}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-slate-900">{value}</span>
        {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
        {trend && (
          <span className="ml-auto">
            <TrendArrow trend={trend} />
          </span>
        )}
      </div>
      {sparkData.length > 1 && (
        <Sparkline data={sparkData} color={sparkColor} height={28} className="mt-1" />
      )}
    </div>
  );
}
