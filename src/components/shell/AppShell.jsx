import { useState } from "react";
import { TopBar } from "./TopBar.jsx";
import { TabBar } from "./TabBar.jsx";
import { LayoutDashboard, PenLine, Dumbbell, CalendarRange, SlidersHorizontal } from "lucide-react";

export const TABS = [
  { id: "dashboard", label: "Dashboard",   icon: LayoutDashboard },
  { id: "daily",     label: "Daily Entry", icon: PenLine },
  { id: "session",   label: "Session",     icon: Dumbbell },
  { id: "plan",      label: "Plan",        icon: CalendarRange },
  { id: "rules",     label: "Règles",      icon: SlidersHorizontal },
];

export function AppShell({ children, activeTab, onTabChange, onExportJson, onImportJson, onExportCsv, onReset }) {
  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      {/* Decorative grid lines — desktop only */}
      <GridDecoration />

      {/* Top bar */}
      <TopBar
        onExportJson={onExportJson}
        onImportJson={onImportJson}
        onExportCsv={onExportCsv}
        onReset={onReset}
      />

      {/* Desktop horizontal tabs */}
      <div className="hidden md:block sticky top-[57px] z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 py-2" aria-label="Navigation principale">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); vibrate(); }}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
                  ${activeTab === tab.id
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
              >
                <tab.icon size={16} aria-hidden />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 md:px-6 py-4 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}

function GridDecoration() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 flex justify-center overflow-hidden">
      <div className="relative w-full max-w-6xl">
        <div className="absolute top-0 bottom-0 left-3 md:left-6 w-px bg-slate-200/50" />
        <div className="absolute top-0 bottom-0 right-3 md:right-6 w-px bg-slate-200/50" />
        {[80, 280].map(top => (
          <div key={top}>
            <div className="absolute left-3 md:left-6 w-3 h-3 rounded-full border border-slate-300/60 bg-white/80"
              style={{ top, transform: "translate(-50%, -50%)" }}>
              <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-slate-300/70" />
            </div>
            <div className="absolute right-3 md:right-6 w-3 h-3 rounded-full border border-slate-300/60 bg-white/80"
              style={{ top, transform: "translate(50%, -50%)" }}>
              <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-slate-300/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function vibrate() {
  try { navigator.vibrate?.(6); } catch {}
}
