import { clsx } from "clsx";

/**
 * Card v2 — fond blanc, ombre douce, bordure stone-100.
 * Variantes : default | elevated | editorial | ghost
 */
export function Card({ children, variant = "default", className, ...props }) {
  const variants = {
    default:    "bg-white border border-stone-200/70 shadow-card",
    elevated:   "bg-white border border-stone-200/70 shadow-card-hover",
    editorial:  "bg-white border border-stone-200/70 shadow-card",
    ghost:      "bg-stone-50/60 border border-stone-200/50",
  };

  return (
    <div
      className={clsx(
        "rounded-2xl",
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
