export function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40
        bg-white/90 backdrop-blur-md border-t border-slate-200/60
        flex items-stretch
        pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navigation principale"
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { onTabChange(tab.id); try { navigator.vibrate?.(6); } catch {} }}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px]
              text-[11px] font-semibold transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500
              ${isActive ? "text-teal-600" : "text-slate-400"}`}
          >
            <span className={`flex items-center justify-center w-9 h-7 rounded-full transition-colors duration-150
              ${isActive ? "bg-teal-50" : ""}`}>
              <tab.icon size={20} aria-hidden strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
