import { clsx } from "clsx";

/**
 * Button v2 — primaire teal doux (#3D9B8E) au lieu d'emerald-500.
 * Variantes : primary | secondary | chaleur | ghost | danger
 */
export function Button({ children, variant = "primary", size = "md", className, ...props }) {
  const base = [
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl cursor-pointer",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
    "active:scale-[.97]",
  ].join(" ");

  const variants = {
    primary:   "bg-teal-500 text-white hover:bg-teal-600 shadow-teal",
    secondary: "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 shadow-sm",
    chaleur:   "bg-chaleur-500 text-white hover:bg-chaleur-600 shadow-chaleur",
    ghost:     "text-stone-600 hover:bg-stone-100",
    danger:    "bg-chaleur-50 border border-chaleur-200 text-chaleur-700 hover:bg-chaleur-100",
  };

  const sizes = {
    sm:  "px-3 py-2 text-sm",
    md:  "px-5 py-3 text-[15px]",
    lg:  "px-6 py-3.5 text-base",
    xl:  "px-8 py-4 text-base",
  };

  return (
    <button
      className={clsx(base, variants[variant] ?? variants.primary, sizes[size] ?? sizes.md, className)}
      {...props}
    >
      {children}
    </button>
  );
}
