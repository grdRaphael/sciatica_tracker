import { clsx } from "clsx";

/**
 * StatusBadge v2 — "jamais de rouge vif" : RED → terracotta doux.
 * Teal remplace l'emerald pour GREEN.
 */
const STYLES = {
  GREEN:  {
    dot:   "bg-teal-500",
    ring:  "shadow-[0_0_8px_rgba(61,155,142,0.6)]",
    label: "text-teal-700",
    wrap:  "bg-teal-50 border-teal-200",
  },
  ORANGE: {
    dot:   "bg-amber-400",
    ring:  "shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    label: "text-amber-700",
    wrap:  "bg-amber-50 border-amber-200",
  },
  RED: {
    dot:   "bg-chaleur-500",                               // terracotta, pas rouge vif
    ring:  "shadow-[0_0_8px_rgba(201,138,107,0.6)]",
    label: "text-chaleur-700",
    wrap:  "bg-chaleur-50 border-chaleur-200",
  },
  GRAY: {
    dot:   "bg-stone-400",
    ring:  "",
    label: "text-stone-500",
    wrap:  "bg-stone-50 border-stone-200",
  },
};

export function StatusBadge({ status = "GRAY", label, size = "md", className }) {
  const s = STYLES[status] ?? STYLES.GRAY;
  const sizes    = { sm: "px-2.5 py-1 text-xs gap-1.5",  md: "px-3.5 py-1.5 text-sm gap-2" };
  const dotSizes = { sm: "w-1.5 h-1.5",                  md: "w-2 h-2" };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border font-semibold",
        s.wrap, s.label, sizes[size] ?? sizes.md,
        className
      )}
    >
      <span
        className={clsx("rounded-full animate-pulse", s.dot, s.ring, dotSizes[size] ?? dotSizes.md)}
        aria-hidden
      />
      {label ?? status}
    </span>
  );
}
