import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, CheckCircle2, TrendingUp, TrendingDown, Minus, BarChart2,
  Plus, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, Copy, Dumbbell,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";
import {
  todayISO, sortLogsByDate, toNumber, round1,
  aggregateSessionExerciseEntries, deriveExerciseAutoLevelState,
  computeExerciseEffortCoefficient, normalizeExerciseName,
  formatSessionProgressDate,
} from "../lib/metrics.js";
import { normalizeSessionExercise } from "../lib/storage.js";
import { Card }    from "../components/v2/Card.jsx";
import { Pill }    from "../components/v2/Pill.jsx";
import { Stepper } from "../components/v2/Stepper.jsx";
import { Button }  from "../components/v2/Button.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ── Constants ──────────────────────────────────────────────────

const FR_DAY   = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const FR_MONTH = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function readableDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${FR_DAY[d.getDay()]} ${d.getDate()} ${FR_MONTH[d.getMonth()]}`;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.25, ease: "easeOut", delay },
});

function emptyExercise(name = "", category = "") {
  return { name, category, level: "standard", sets: 2, reps: 10, holdSec: 0, tempo: "", load: "", notes: "" };
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

// ── Coefficient → session level label ─────────────────────────

function sessionLevelFromCoeff(coeff) {
  if (coeff === 0) return null;
  if (coeff < 10) return { label: "Léger",     color: "GRAY" };
  if (coeff < 25) return { label: "Standard",  color: "progression" };
  return               { label: "Intensif",   color: "GREEN" };
}

// ── Per-exercise auto-level ────────────────────────────────────

function useAutoLevel(exerciseName, currentExercises, prevSession, exercisesLibrary) {
  return useMemo(() => {
    if (!exerciseName) return null;
    const normName = normalizeExerciseName(exerciseName);
    const currentEntries = currentExercises.filter(
      ex => normalizeExerciseName(ex.name) === normName
    );
    const aggregate = aggregateSessionExerciseEntries(currentEntries, exercisesLibrary);
    let reference = null;
    if (prevSession) {
      const prevEntries = prevSession.exercises.filter(
        ex => normalizeExerciseName(ex.name) === normName
      );
      if (prevEntries.length) {
        reference = { ...aggregateSessionExerciseEntries(prevEntries, exercisesLibrary), date: prevSession.date };
      }
    }
    return deriveExerciseAutoLevelState(exerciseName, aggregate, reference, exercisesLibrary);
  }, [exerciseName, currentExercises, prevSession, exercisesLibrary]);
}

// ── Exercise progress chart ────────────────────────────────────

function ExerciseProgressChart({ exerciseName, allSessionLogs, exercisesLibrary }) {
  const norm   = normalizeExerciseName(exerciseName);
  const sorted = useMemo(() => sortLogsByDate(allSessionLogs), [allSessionLogs]);

  const points = useMemo(() => sorted
    .filter(s => s.exercises.some(ex => normalizeExerciseName(ex.name) === norm))
    .map(s => {
      const entries = s.exercises.filter(ex => normalizeExerciseName(ex.name) === norm);
      const agg = aggregateSessionExerciseEntries(entries, exercisesLibrary);
      return { date: s.date, coeff: agg.effortCoeff };
    }),
    [sorted, norm, exercisesLibrary]
  );

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-20 text-stone-400 text-xs">
        Minimum 2 séances pour afficher la progression
      </div>
    );
  }

  const data = {
    labels: points.map(p => formatSessionProgressDate(p.date)),
    datasets: [{
      data: points.map(p => p.coeff),
      borderColor: "#3D9B8E",
      backgroundColor: "rgba(61,155,142,0.08)",
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: "#3D9B8E",
    }],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { bodyFont: { family: "Inter" } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#A8A29E", font: { size: 10 } } },
      y: { grid: { color: "rgba(168,162,158,0.12)" }, ticks: { color: "#A8A29E", font: { size: 10 } }, beginAtZero: true },
    },
  };

  return <div style={{ height: 140 }}><Line data={data} options={opts} /></div>;
}

// ── Stepper cell ───────────────────────────────────────────────

function StepperCell({ label, value, onChange, step = 1 }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-stone-50 border border-stone-100 py-2 px-1">
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">{label}</span>
      <Stepper value={value} onChange={onChange} min={0} step={step} label={label} />
    </div>
  );
}

// ── Exercise row (compact + expandable) ───────────────────────

function ExerciseRow({
  exercise, index, isDone, isExpanded, showProgress,
  onToggleDone, onToggleExpand, onUpdate, onRemove, onToggleProgress,
  prevSession, exercisesLibrary, allSessionLogs, currentExercises,
}) {
  const autoLevel   = useAutoLevel(exercise.name, currentExercises, prevSession, exercisesLibrary);
  const effortCoeff = useMemo(() => computeExerciseEffortCoefficient(exercise), [exercise]);
  const set = (key) => (val) => onUpdate(index, { ...exercise, [key]: val });

  const levelKey = autoLevel?.level || exercise.level;
  const levelIcon =
    levelKey === "progression" ? <TrendingUp  size={11} aria-hidden /> :
    levelKey === "regression"  ? <TrendingDown size={11} aria-hidden /> :
                                 <Minus size={11} aria-hidden />;

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-all duration-200
        ${isDone
          ? "bg-teal-50/60 border-teal-200/70"
          : "bg-white border-stone-200/70 shadow-card"
        }`}
    >
      {/* Compact header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Done toggle */}
        <button
          type="button"
          onClick={() => { onToggleDone(); try { navigator.vibrate?.(6); } catch {} }}
          aria-label={isDone ? "Marquer comme non fait" : "Marquer comme fait"}
          className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center
            transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
            ${isDone
              ? "bg-teal-500 border-teal-500"
              : "border-stone-300 hover:border-teal-400"
            }`}
        >
          {isDone && <Check size={14} className="text-white" strokeWidth={3} />}
        </button>

        {/* Name + pills */}
        <div
          className="flex-1 min-w-0 cursor-pointer select-none"
          onClick={onToggleExpand}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && onToggleExpand()}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm truncate
              ${isDone ? "text-teal-700 line-through decoration-teal-400/50" : "text-stone-900"}`}>
              {exercise.name || "Exercice sans nom"}
            </span>
            <Pill color={levelKey} size="sm">
              <span className="flex items-center gap-1">{levelIcon} {levelKey}</span>
            </Pill>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {exercise.category && (
              <span className="text-[11px] text-stone-400">{exercise.category}</span>
            )}
            <span className="text-[11px] text-stone-400">
              {exercise.sets}×{exercise.reps}
              {exercise.holdSec > 0 ? ` · ${exercise.holdSec}s` : ""}
              {exercise.load ? ` · ${exercise.load}kg` : ""}
              {" · "}<span className="font-semibold text-stone-500">{effortCoeff}</span>
            </span>
          </div>
          {autoLevel?.deltaPct != null && (
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              vs {autoLevel.referenceDate} ({autoLevel.deltaPct > 0 ? "+" : ""}{autoLevel.deltaPct}%)
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleProgress(exercise.name)}
            aria-label={`Progression ${exercise.name}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-stone-400 hover:text-teal-600 hover:bg-teal-50
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <BarChart2 size={15} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Replier" : "Modifier"}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-stone-400 hover:text-stone-700 hover:bg-stone-100
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {isExpanded ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Supprimer ${exercise.name}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-stone-400 hover:text-chaleur-600 hover:bg-chaleur-50
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaleur-400"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </div>
      </div>

      {/* Expanded editing panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-3">
              {/* Steppers */}
              <div className="grid grid-cols-3 gap-2">
                <StepperCell label="Sets"    value={exercise.sets}    onChange={set("sets")} />
                <StepperCell label="Reps"    value={exercise.reps}    onChange={set("reps")} />
                <StepperCell label="Hold (s)" value={exercise.holdSec} onChange={set("holdSec")} step={5} />
              </div>

              {/* Load + Tempo */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wide block mb-1.5">
                    Charge (kg)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={exercise.load}
                    onChange={e => set("load")(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200
                      focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wide block mb-1.5">
                    Tempo
                  </label>
                  <input
                    type="text"
                    value={exercise.tempo}
                    onChange={e => set("tempo")(e.target.value)}
                    placeholder="ex: 2-1-2"
                    className="w-full text-sm px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200
                      focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wide block mb-1.5">
                  Notes
                </label>
                <input
                  type="text"
                  value={exercise.notes}
                  onChange={e => set("notes")(e.target.value)}
                  placeholder="Ressenti, adaptations…"
                  className="w-full text-sm px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200
                    focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>

              {/* Coeff footer */}
              <div className="text-right text-[11px] text-stone-400">
                Coeff. effort :&nbsp;
                <span className="font-bold font-serif text-base text-stone-600">{effortCoeff}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress chart (expandable) */}
      <AnimatePresence>
        {showProgress && (
          <motion.div
            key="prog"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-stone-100 pt-3">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                Progression — {exercise.name}
              </p>
              <ExerciseProgressChart
                exerciseName={exercise.name}
                allSessionLogs={allSessionLogs}
                exercisesLibrary={exercisesLibrary}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main view ─────────────────────────────────────────────────

export function SessionLogView({ state, upsertSessionLog, getSessionByDate, getPreviousSessionBefore }) {
  const today = todayISO();
  const { exercisesLibrary, sessionLogs } = state;

  const [date, setDate]         = useState(today);
  const [title, setTitle]       = useState(() => getSessionByDate(today)?.title ?? "");
  const [exercises, setExercises] = useState(() => {
    const s = getSessionByDate(today);
    return s ? s.exercises.map(ex => ({ ...ex })) : [];
  });
  const [doneSet, setDoneSet]     = useState(() => new Set());
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [progressEx, setProgressEx]   = useState(null);
  const [saved, setSaved]         = useState(false);
  const [libraryPick, setLibraryPick] = useState("");
  const [addName, setAddName]         = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [showAddNew, setShowAddNew]   = useState(false);

  const prevSession = useMemo(() => getPreviousSessionBefore(date), [date, getPreviousSessionBefore]);

  const handleDateChange = useCallback((newDate) => {
    setDate(newDate);
    setSaved(false);
    setExpandedIdx(null);
    setProgressEx(null);
    setDoneSet(new Set());
    const s = getSessionByDate(newDate);
    setExercises(s ? s.exercises.map(ex => ({ ...ex })) : []);
    setTitle(s?.title ?? "");
  }, [getSessionByDate]);

  const goBack = () => {
    const prev = addDays(date, -1);
    handleDateChange(prev);
  };
  const goForward = () => {
    if (date < today) handleDateChange(addDays(date, 1));
  };
  const goToday = () => handleDateChange(today);

  const loadPrevSession = () => {
    if (!prevSession) return;
    setExercises(prevSession.exercises.map(ex => ({ ...ex })));
    setTitle(prev => prev || prevSession.title || "");
    setDoneSet(new Set());
    setSaved(false);
  };

  const addFromLibrary = () => {
    if (!libraryPick) return;
    const libEntry = exercisesLibrary.find(ex => ex.name === libraryPick);
    setExercises(prev => [...prev, emptyExercise(libraryPick, libEntry?.category || "")]);
    setLibraryPick("");
    setSaved(false);
  };

  const addNewExercise = () => {
    const trimmed = addName.trim();
    if (!trimmed) return;
    setExercises(prev => [...prev, emptyExercise(trimmed, addCategory.trim())]);
    setAddName("");
    setAddCategory("");
    setShowAddNew(false);
    setSaved(false);
  };

  const updateExercise = (index, updated) => {
    setExercises(prev => prev.map((ex, i) => i === index ? normalizeSessionExercise(updated) : ex));
    setSaved(false);
  };

  const removeExercise = (index) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
    setDoneSet(prev => {
      const next = new Set();
      prev.forEach(idx => { if (idx < index) next.add(idx); else if (idx > index) next.add(idx - 1); });
      return next;
    });
    if (expandedIdx === index) setExpandedIdx(null);
    else if (expandedIdx > index) setExpandedIdx(i => i - 1);
    setSaved(false);
  };

  const toggleDone = (index) => {
    setDoneSet(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const toggleExpand = (index) => {
    setExpandedIdx(prev => prev === index ? null : index);
  };

  const toggleProgress = (exName) => {
    setProgressEx(prev => prev === exName ? null : exName);
  };

  const handleSave = () => {
    upsertSessionLog({ date, title: title.trim(), exercises });
    setSaved(true);
    try { navigator.vibrate?.([10, 30, 10]); } catch {}
    setTimeout(() => setSaved(false), 3000);
  };

  const totalCoeff = useMemo(
    () => round1(exercises.reduce((s, ex) => s + computeExerciseEffortCoefficient(ex), 0)),
    [exercises]
  );

  const doneCount = doneSet.size;
  const sessionLevel = sessionLevelFromCoeff(totalCoeff);

  const usedNames = new Set(exercises.map(ex => normalizeExerciseName(ex.name)));
  const availableInLibrary = exercisesLibrary.filter(ex => !usedNames.has(normalizeExerciseName(ex.name)));

  const isToday = date === today;
  const isEmpty = exercises.length === 0;

  return (
    <div className="space-y-4 pb-32">

      {/* ── Date navigation ───────────────────────────────────── */}
      <motion.div {...fadeUp(0)}>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Jour précédent"
              className="w-9 h-9 flex items-center justify-center rounded-full
                border border-stone-200 text-stone-500 hover:bg-stone-100
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <ChevronLeft size={18} aria-hidden />
            </button>

            <div className="flex-1 text-center">
              <p className="font-serif text-[17px] font-semibold text-stone-900">
                {readableDate(date)}
              </p>
              {prevSession && (
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Dernière séance : {readableDate(prevSession.date)} · {prevSession.exercises.length} exos
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={goForward}
              disabled={isToday}
              aria-label="Jour suivant"
              className="w-9 h-9 flex items-center justify-center rounded-full
                border border-stone-200 text-stone-500 hover:bg-stone-100
                transition-colors disabled:opacity-30 disabled:pointer-events-none
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={goToday}
              className="mt-3 w-full py-2 rounded-xl text-sm font-semibold
                border border-stone-200 text-stone-600 hover:bg-stone-50
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              Revenir à aujourd'hui
            </button>
          )}
        </Card>
      </motion.div>

      {/* ── Session title ────────────────────────────────────── */}
      <motion.div {...fadeUp(0.04)}>
        <Card className="px-4 py-3">
          <label htmlFor="session-title" className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block mb-2">
            Titre de la séance
          </label>
          <input
            id="session-title"
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setSaved(false); }}
            placeholder="ex: Renforcement lombaire semaine 3…"
            className="w-full text-sm font-medium text-stone-900 placeholder:text-stone-300
              bg-transparent border-0 focus:outline-none focus:ring-0 py-1"
          />
        </Card>
      </motion.div>

      {/* ── Reprendre séance CTA (when empty + prev exists) ──── */}
      <AnimatePresence>
        {isEmpty && prevSession && (
          <motion.div {...fadeUp(0.06)}>
            <button
              type="button"
              onClick={loadPrevSession}
              className="w-full flex items-center gap-4 p-4 rounded-2xl
                bg-teal-50 border border-teal-200/70 hover:bg-teal-100/60
                transition-colors duration-200 text-left cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shrink-0 shadow-teal">
                <Copy size={18} className="text-white" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-teal-800 text-sm">Reprendre la séance précédente</p>
                <p className="text-[12px] text-teal-600 mt-0.5 truncate">
                  {readableDate(prevSession.date)} · {prevSession.exercises.length} exercice{prevSession.exercises.length > 1 ? "s" : ""}
                  {prevSession.title ? ` · ${prevSession.title}` : ""}
                </p>
              </div>
              <ChevronRight size={16} className="text-teal-500 shrink-0" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary banner ───────────────────────────────────── */}
      <AnimatePresence>
        {exercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 px-1">
              {/* Done count */}
              <div className="rounded-xl bg-white border border-stone-200 px-4 py-2.5 flex flex-col items-center min-w-[72px]">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Faits</span>
                <span className="font-serif text-2xl font-semibold text-stone-900 tabular-nums leading-tight">
                  {doneCount}<span className="text-sm text-stone-400">/{exercises.length}</span>
                </span>
              </div>

              {/* Total coeff */}
              <div className="rounded-xl bg-white border border-stone-200 px-4 py-2.5 flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Coeff.</span>
                <span className="font-serif text-2xl font-semibold text-teal-600 tabular-nums leading-tight">
                  {totalCoeff}
                </span>
              </div>

              {/* Level */}
              {sessionLevel && (
                <div className="flex-1 flex flex-col items-start justify-center gap-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Niveau</span>
                  <Pill color={sessionLevel.color} size="md">{sessionLevel.label}</Pill>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exercise list ────────────────────────────────────── */}
      {exercises.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Exercices ({exercises.length})</SectionLabel>
          <AnimatePresence initial={false}>
            {exercises.map((ex, i) => (
              <ExerciseRow
                key={`${ex.name}-${i}`}
                exercise={ex}
                index={i}
                isDone={doneSet.has(i)}
                isExpanded={expandedIdx === i}
                showProgress={progressEx === ex.name}
                onToggleDone={() => toggleDone(i)}
                onToggleExpand={() => toggleExpand(i)}
                onUpdate={updateExercise}
                onRemove={removeExercise}
                onToggleProgress={toggleProgress}
                prevSession={prevSession}
                exercisesLibrary={exercisesLibrary}
                allSessionLogs={sessionLogs}
                currentExercises={exercises}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────── */}
      {isEmpty && !prevSession && (
        <motion.div {...fadeUp(0.08)} className="py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={24} className="text-stone-400" aria-hidden />
          </div>
          <p className="text-stone-500 font-semibold text-sm">Aucun exercice pour cette séance</p>
          <p className="text-stone-400 text-xs mt-1">Ajoutez des exercices depuis la bibliothèque ci-dessous</p>
        </motion.div>
      )}

      {/* ── Add exercises ────────────────────────────────────── */}
      <motion.div {...fadeUp(0.1)}>
        <Card className="p-4 space-y-3">
          <SectionLabel>Ajouter depuis la bibliothèque</SectionLabel>

          <div className="flex gap-2">
            <select
              value={libraryPick}
              onChange={e => setLibraryPick(e.target.value)}
              className="flex-1 text-sm px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200
                focus:outline-none focus:ring-2 focus:ring-teal-400 text-stone-700"
              aria-label="Sélectionner un exercice"
            >
              <option value="">Choisir un exercice…</option>
              {availableInLibrary.map(ex => (
                <option key={ex.name} value={ex.name}>
                  {ex.name}{ex.category ? ` (${ex.category})` : ""}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={addFromLibrary}
              disabled={!libraryPick}
              className="shrink-0"
            >
              <Plus size={15} aria-hidden /> Ajouter
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddNew(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-stone-500
              hover:text-teal-600 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {showAddNew ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
            Nouvel exercice (hors bibliothèque)
          </button>

          <AnimatePresence>
            {showAddNew && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={addName}
                    onChange={e => setAddName(e.target.value)}
                    placeholder="Nom de l'exercice"
                    className="w-full text-sm px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200
                      focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <input
                    type="text"
                    value={addCategory}
                    onChange={e => setAddCategory(e.target.value)}
                    placeholder="Catégorie (ex: Core, Glute…)"
                    className="w-full text-sm px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200
                      focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addNewExercise}
                    disabled={!addName.trim()}
                    className="w-full"
                  >
                    <Plus size={14} aria-hidden /> Créer et ajouter
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* ── Sticky save footer ───────────────────────────────── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30
        bg-white/90 backdrop-blur-md border-t border-stone-200/60
        px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-2xl mx-auto space-y-1.5">
          <AnimatePresence>
            {saved && (
              <motion.div
                key="saved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5 text-xs text-teal-600 font-semibold"
              >
                <CheckCircle2 size={13} aria-hidden /> Séance enregistrée
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleSave}
            disabled={exercises.length === 0}
            className="w-full flex items-center justify-center gap-2
              bg-teal-500 hover:bg-teal-600 active:scale-[0.98]
              text-white font-bold text-base rounded-2xl
              py-3.5 shadow-teal
              transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <Save size={18} aria-hidden />
            Enregistrer la séance
          </button>
        </div>
      </div>
    </div>
  );
}
