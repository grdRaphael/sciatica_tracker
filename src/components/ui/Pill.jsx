import { clsx } from "clsx";

const TRAFFIC_STYLES = {
  GREEN: "bg-traffic-green-bg text-traffic-green-text border-traffic-green-border",
  ORANGE: "bg-traffic-orange-bg text-traffic-orange-text border-traffic-orange-border",
  RED: "bg-traffic-red-bg text-traffic-red-text border-traffic-red-border",
  GRAY: "bg-slate-100 text-slate-600 border-slate-200",
  YES: "bg-traffic-green-bg text-traffic-green-text border-traffic-green-border",
  NO: "bg-traffic-orange-bg text-traffic-orange-text border-traffic-orange-border",
  progression: "bg-emerald-50 text-emerald-700 border-emerald-200",
  regression: "bg-red-50 text-red-700 border-red-200",
  standard: "bg-slate-100 text-slate-600 border-slate-200",
};

export function Pill({ children, color = "GRAY", size = "md", className }) {
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs font-semibold",
    lg: "px-4 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full border transition-colors duration-200",
        TRAFFIC_STYLES[color] || TRAFFIC_STYLES.GRAY,
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
