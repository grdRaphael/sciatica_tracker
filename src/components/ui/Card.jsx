import { clsx } from "clsx";

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border border-slate-200/70 shadow-card",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
