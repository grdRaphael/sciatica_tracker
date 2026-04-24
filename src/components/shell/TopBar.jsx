import { useState, useRef } from "react";
import { MoreVertical, Download, Upload, FileDown, RotateCcw, Activity } from "lucide-react";

export function TopBar({ onExportJson, onImportJson, onExportCsv, onReset }) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);

  function handleImport(e) {
    const f = e.target.files?.[0];
    if (f) onImportJson(f);
    e.target.value = "";
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-[57px] flex items-center px-4">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center shadow-sm">
            <Activity size={15} className="text-white" aria-hidden />
          </span>
          <span className="font-bold text-slate-900 tracking-tight hidden sm:inline">Sciatica Tracker</span>
          <span className="font-bold text-slate-900 tracking-tight sm:hidden">Sciatica</span>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <ActionButton icon={Download} label="Export JSON" onClick={() => { onExportJson(); }} />
          <ActionButton icon={FileDown} label="Export CSV" onClick={() => { onExportCsv(); }} />
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
            border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer
            transition-colors duration-150 focus-within:ring-2 focus-within:ring-teal-500">
            <Upload size={14} aria-hidden /> Import JSON
            <input type="file" accept=".json" className="sr-only" onChange={handleImport} />
          </label>
          <button onClick={() => { if (confirm("Reset complet des données ?")) onReset(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
              border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
            <RotateCcw size={14} aria-hidden /> Reset
          </button>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden relative">
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="Menu actions"
            aria-expanded={open}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100
              text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <MoreVertical size={20} aria-hidden />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
              <div className="absolute right-0 top-10 z-50 w-52 bg-white rounded-2xl border border-slate-200 shadow-card-hover overflow-hidden">
                <MenuItem icon={Download} label="Export JSON" onClick={() => { onExportJson(); setOpen(false); }} />
                <MenuItem icon={FileDown} label="Export CSV" onClick={() => { onExportCsv(); setOpen(false); }} />
                <label className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <Upload size={16} className="text-slate-400" aria-hidden /> Import JSON
                  <input type="file" accept=".json" className="sr-only" ref={fileRef} onChange={handleImport} />
                </label>
                <div className="border-t border-slate-100" />
                <MenuItem icon={RotateCcw} label="Reset données" onClick={() => { if (confirm("Reset ?")) { onReset(); setOpen(false); } }} danger />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
        border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer
        transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
      <Icon size={14} aria-hidden /> {label}
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors
        ${danger ? "text-red-600" : "text-slate-700"}`}>
      <Icon size={16} className={danger ? "text-red-400" : "text-slate-400"} aria-hidden />
      {label}
    </button>
  );
}
