import { clsx } from "clsx";

/**
 * Pill v2 — teal remplace emerald, terracotta remplace rouge vif pour progression/regression.
 */
const STYLES = {
  GREEN:      "bg-teal-50      text-teal-700      border-teal-200",
  ORANGE:     "bg-amber-50     text-amber-700     border-amber-200",
  RED:        "bg-chaleur-50   text-chaleur-700   border-chaleur-200",
  GRAY:       "bg-stone-100    text-stone-600     border-stone-200",
  YES:        "bg-teal-50      text-teal-700      border-teal-200",
  NO:         "bg-amber-50     text-amber-700     border-amber-200",
  progression:"bg-teal-50      text-teal-700      border-teal-200",
  regression: "bg-chaleur-50   text-chaleur-700   border-chaleur-200",
  standard:   "bg-stone-100    text-stone-600     border-stone-200",
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
        STYLES[color] ?? STYLES.GRAY,
        sizes[size] ?? sizes.md,
        className
      )}
    >
      {children}
    </span>
  );
}
