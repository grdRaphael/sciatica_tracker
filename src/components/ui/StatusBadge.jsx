import { clsx } from "clsx";

const STYLES = {
  GREEN:  { dot: "bg-emerald-500", ring: "shadow-[0_0_8px_rgba(16,185,129,0.7)]", label: "text-emerald-700", wrap: "bg-emerald-50 border-emerald-200" },
  ORANGE: { dot: "bg-amber-400",   ring: "shadow-[0_0_8px_rgba(245,158,11,0.7)]",  label: "text-amber-700",  wrap: "bg-amber-50 border-amber-200" },
  RED:    { dot: "bg-red-500",     ring: "shadow-[0_0_8px_rgba(239,68,68,0.7)]",   label: "text-red-700",    wrap: "bg-red-50 border-red-200" },
  GRAY:   { dot: "bg-slate-400",   ring: "",                                         label: "text-slate-600",  wrap: "bg-slate-50 border-slate-200" },
};

export function StatusBadge({ status = "GRAY", label, size = "md", className }) {
  const s = STYLES[status] || STYLES.GRAY;
  const sizes = { sm: "px-2 py-0.5 text-xs gap-1.5", md: "px-3 py-1.5 text-sm gap-2" };
  const dotSizes = { sm: "w-1.5 h-1.5", md: "w-2.5 h-2.5" };

  return (
    <span className={clsx("inline-flex items-center rounded-full border font-semibold", s.wrap, s.label, sizes[size], className)}>
      <span className={clsx("rounded-full animate-pulse", s.dot, s.ring, dotSizes[size])} aria-hidden />
      {label || status}
    </span>
  );
}
