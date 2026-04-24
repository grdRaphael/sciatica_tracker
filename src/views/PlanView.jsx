import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2, RotateCcw } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { cloneDefaultPlan4Weeks } from "../lib/storage.js";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: "easeOut", delay },
});

const WEEK_COLORS = [
  { border: "border-l-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
  { border: "border-l-blue-400",    bg: "bg-blue-50",    text: "text-blue-700" },
  { border: "border-l-violet-400",  bg: "bg-violet-50",  text: "text-violet-700" },
  { border: "border-l-amber-400",   bg: "bg-amber-50",   text: "text-amber-700" },
];

function TextField({ label, value, onChange, multiline = false }) {
  const cls = `w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
    px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
    transition-shadow duration-150 placeholder:text-slate-400`;

  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={2}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, unit = "min" }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="w-24 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
            px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

export function PlanView({ state, savePlan }) {
  const [plan, setPlan] = useState(() => state.plan4Weeks.map(w => ({ ...w })));
  const [saved, setSaved] = useState(false);

  const updateWeek = (weekIdx, key, value) => {
    setPlan(prev => prev.map((w, i) => i === weekIdx ? { ...w, [key]: value } : w));
    setSaved(false);
  };

  const handleSave = () => {
    savePlan(plan);
    setSaved(true);
    try { navigator.vibrate?.([10, 30, 10]); } catch {}
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (!confirm("Réinitialiser le plan aux valeurs par défaut ?")) return;
    const defaults = cloneDefaultPlan4Weeks();
    setPlan(defaults);
    setSaved(false);
  };

  return (
    <div className="space-y-4 pb-24">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-slate-900">Plan 4 semaines</h2>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500
            hover:text-red-600 transition-colors px-3 py-2 rounded-xl hover:bg-red-50
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <RotateCcw size={14} aria-hidden /> Réinitialiser
        </button>
      </motion.div>

      {plan.map((week, i) => {
        const colors = WEEK_COLORS[i % WEEK_COLORS.length];
        return (
          <motion.div key={week.week} {...fadeUp(i * 0.06)}>
            <Card className={`p-5 border-l-4 ${colors.border} space-y-4`}>
              {/* Week header */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                Semaine {week.week}
              </div>

              <TextField
                label="Titre"
                value={week.title}
                onChange={v => updateWeek(i, "title", v)}
              />
              <TextField
                label="Objectifs"
                value={week.objectives}
                onChange={v => updateWeek(i, "objectives", v)}
                multiline
              />
              <TextField
                label="Exercices prioritaires"
                value={week.priorityExercises}
                onChange={v => updateWeek(i, "priorityExercises", v)}
                multiline
              />

              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Cible assise"
                  value={week.sittingTargetMin}
                  onChange={v => updateWeek(i, "sittingTargetMin", v)}
                />
                <NumberField
                  label="Cible voiture"
                  value={week.carTargetMin}
                  onChange={v => updateWeek(i, "carTargetMin", v)}
                />
              </div>

              <TextField
                label="Règle de progression"
                value={week.progressionRule}
                onChange={v => updateWeek(i, "progressionRule", v)}
                multiline
              />
              <TextField
                label="Version mauvais jour"
                value={week.badDayVersion}
                onChange={v => updateWeek(i, "badDayVersion", v)}
                multiline
              />
              <TextField
                label="Validation fin de semaine"
                value={week.endValidation}
                onChange={v => updateWeek(i, "endValidation", v)}
              />
            </Card>
          </motion.div>
        );
      })}

      {/* Save row */}
      <motion.div {...fadeUp(0.28)} className="sticky bottom-20 md:bottom-4 z-20">
        <div className="max-w-2xl mx-auto px-1">
          {saved && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold mb-2">
              <CheckCircle2 size={13} aria-hidden /> Plan enregistré
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2
              bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]
              text-white font-bold text-base rounded-2xl
              py-3.5 shadow-lg shadow-emerald-500/30
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Save size={18} aria-hidden /> Enregistrer le plan
          </button>
        </div>
      </motion.div>
    </div>
  );
}
