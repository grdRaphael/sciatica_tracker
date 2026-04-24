import { clsx } from "clsx";

export function Button({ children, variant = "primary", size = "md", className, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[.98] shadow-sm",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[.98] shadow-sm",
    danger: "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 active:scale-[.98]",
    ghost: "text-slate-600 hover:bg-slate-100 active:scale-[.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

// Glassmorphism CTA — used for primary save action only
export function GlassButton({ children, className, ...props }) {
  return (
    <button
      className={clsx(
        "relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer",
        "bg-white/30 backdrop-blur-md border border-white/80",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.06)]",
        "text-emerald-800 hover:bg-white/50 active:scale-[.98]",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        "overflow-hidden",
        "@media (prefers-reduced-motion: no-preference) motion-safe:group",
        className
      )}
      {...props}
    >
      {/* spinning conic ring — hidden if prefers-reduced-motion */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl motion-safe:animate-spin-slow"
        style={{
          background: "conic-gradient(from 0deg, transparent 60%, rgba(16,185,129,0.4) 100%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1.5px",
        }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
