import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Copy, CheckCircle2, Info, ChevronLeft, ChevronRight } from "lucide-react";
import {
  todayISO, computeTrafficLight, computeSymptomIndex,
  validateDailyLog, toNumber,
} from "../lib/metrics.js";
import { Card }          from "../components/v2/Card.jsx";
import { GradientSlider } from "../components/v2/GradientSlider.jsx";
import { Stepper }        from "../components/v2/Stepper.jsx";
import { StatusBadge }    from "../components/v2/StatusBadge.jsx";

// ── Constants ─────────────────────────────────────────────────────

const FR_DAY   = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const FR_MONTH = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function readableDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${FR_DAY[d.getDay()]} ${d.getDate()} ${FR_MONTH[d.getMonth()]}`;
}

function emptyLog(date) {
  return {
    date,
    sleep: 5, dayQuality: 5,
    pain: 3, paresthesiaGlute: 2, paresthesiaFoot: 2,
    sacrumTension: 2, symptomsMorning: 2, symptomsAfterSitting: 3,
    sittingMaxMin: 30, carMaxMin: 20,
    walk1Min: 20, walk2Min: 0,
    sessionDurationMin: 0, sessionRpe: 0,
    reactionImmediate: "same", reaction24h: "same",
    notes: "",
  };
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.25, ease: "easeOut", delay },
});

// ── Sub-components ─────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px bg-stone-100 my-1" aria-hidden />;
}

// Segmented control Mieux / Pareil / Pire
function ReactionPicker({ label, value, onChange }) {
  const opts = [
    { value: "better", label: "Mieux",  active: "bg-teal-500 border-teal-500 text-white",   inactive: "bg-white border-stone-200 text-stone-500 hover:border-teal-300 hover:text-teal-600" },
    { value: "same",   label: "Pareil", active: "bg-stone-700 border-stone-700 text-white",   inactive: "bg-white border-stone-200 text-stone-500 hover:border-stone-400" },
    { value: "worse",  label: "Pire",   active: "bg-chaleur-500 border-chaleur-500 text-white", inactive: "bg-white border-stone-200 text-stone-500 hover:border-chaleur-300 hover:text-chaleur-600" },
  ];
  return (
    <div>
      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">{label}</p>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {opts.map(o => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => { onChange(o.value); try { navigator.vibrate?.(6); } catch {} }}
            className={`flex-1 py-3 rounded-2xl border-2 text-[15px] font-semibold
              transition-all duration-200 min-h-[48px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
              ${value === o.value ? o.active : o.inactive}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Stepper row for duration/minutes fields
function StepperRow({ label, sub, value, onChange, step = 5 }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-[15px] font-semibold text-stone-800">{label}</p>
        {sub && <p className="text-xs text-stone-400">{sub}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Stepper value={value} onChange={onChange} min={0} step={step} label={label} />
        <span className="text-sm text-stone-400 w-6">min</span>
      </div>
    </div>
  );
}

// Inline threshold hint badge
function ThresholdHint({ label, value, redMax, orangeMax }) {
  const v = toNumber(value);
  if (v <= redMax)    return <span className="text-[11px] font-semibold text-chaleur-600 bg-chaleur-50 border border-chaleur-100 px-2 py-0.5 rounded-full">{label} · seuil bas</span>;
  if (v <= orangeMax) return <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">{label} · modéré</span>;
  return <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">{label} · OK</span>;
}

// ── Main view ──────────────────────────────────────────────────────

export function DailyEntryView({ state, upsertDailyLog, getDailyByDate, getPreviousDailyBefore }) {
  const today = todayISO();

  const [date, setDate]   = useState(today);
  const [form, setForm]   = useState(() => getDailyByDate(today) ?? emptyLog(today));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleDateChange = useCallback((newDate) => {
    setDate(newDate);
    setSaved(false);
    setError("");
    setForm(getDailyByDate(newDate) ?? emptyLog(newDate));
  }, [getDailyByDate]);

  // Navigate days
  const goPrev = () => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() - 1);
    handleDateChange(d.toISOString().slice(0, 10));
  };
  const goNext = () => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().slice(0, 10);
    if (next <= today) handleDateChange(next);
  };

  const duplicatePrev = () => {
    const prev = getPreviousDailyBefore(date);
    if (!prev) { setError("Aucun jour précédent."); return; }
    setForm({ ...prev, date, reactionImmediate: "same", reaction24h: "same", notes: "" });
    setSaved(false);
    setError("");
  };

  const set = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }));
    setSaved(false);
    setError("");
  };

  const handleSave = () => {
    const v = validateDailyLog(form);
    if (!v.ok) { setError(v.message); return; }
    upsertDailyLog(form);
    setSaved(true);
    setError("");
    try { navigator.vibrate?.([10, 30, 10]); } catch {}
    setTimeout(() => setSaved(false), 3000);
  };

  const prevLog = useMemo(() => getPreviousDailyBefore(date), [date, getPreviousDailyBefore]);
  const traffic = useMemo(
    () => computeTrafficLight(form, prevLog, state.rulesSettings),
    [form, prevLog, state.rulesSettings]
  );
  const symptomIndex = useMemo(() => computeSymptomIndex(form), [form]);
  const isToday    = date === today;
  const isExisting = !!getDailyByDate(date);

  return (
    <div className="space-y-4 pb-36 max-w-lg mx-auto">

      {/* ── Header : date + navigation ── */}
      <motion.div {...fadeUp(0)}>
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Jour précédent"
              className="w-9 h-9 flex items-center justify-center rounded-full
                bg-white border border-stone-200 text-stone-500
                hover:bg-stone-50 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <div>
              <p className="text-[13px] text-stone-400 font-medium leading-none">{isToday ? "Aujourd'hui" : "Passé"}</p>
              <p className="text-xl font-fraunces font-semibold text-stone-900">{readableDate(date)}</p>
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={isToday}
              aria-label="Jour suivant"
              className="w-9 h-9 flex items-center justify-center rounded-full
                bg-white border border-stone-200 text-stone-500
                hover:bg-stone-50 transition-colors disabled:opacity-30 disabled:pointer-events-none
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                type="button"
                onClick={() => handleDateChange(today)}
                className="text-[13px] font-semibold text-teal-600 bg-teal-50
                  px-3 py-1.5 rounded-full border border-teal-200
                  hover:bg-teal-100 transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                Aujourd'hui
              </button>
            )}
            <button
              type="button"
              onClick={duplicatePrev}
              className="text-[13px] font-semibold text-stone-500 bg-white
                px-3 py-1.5 rounded-full border border-stone-200
                hover:bg-stone-50 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Copier le jour précédent"
            >
              Hier
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Live preview (feu + index) ── */}
      <motion.div {...fadeUp(0.05)}>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={traffic} size="sm" />
            {isExisting && !saved && (
              <span className="text-[11px] text-teal-600 font-semibold">Modification</span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] text-stone-400 font-bold uppercase tracking-widest">Symptom Index</span>
            <span className="text-xl font-fraunces font-semibold text-stone-900 tabular-nums ml-2">{symptomIndex}</span>
            <span className="text-xs text-stone-400">/ 10</span>
          </div>
        </div>
      </motion.div>

      {/* ── Section: Douleur du matin ── */}
      <motion.div {...fadeUp(0.08)}>
        <Card className="p-5">
          <SectionLabel>Douleur du matin</SectionLabel>
          <GradientSlider
            id="pain"
            value={form.pain}
            onChange={set("pain")}
            scaleLabels={["Aucune", "Modérée", "Intense"]}
          />
        </Card>
      </motion.div>

      {/* ── Section: Par rapport à hier ── */}
      <motion.div {...fadeUp(0.1)}>
        <Card className="p-5">
          <ReactionPicker
            label="Par rapport à hier"
            value={form.reactionImmediate}
            onChange={set("reactionImmediate")}
          />
          {form.reactionImmediate === "worse" && (
            <div className="mt-3 flex gap-2 items-start p-3 rounded-xl bg-chaleur-50 border border-chaleur-100 text-xs text-chaleur-700">
              <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
              <span>Réaction "Pire" → flare potentiel, feu rouge possible.</span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── Section: Paresthésies ── */}
      <motion.div {...fadeUp(0.12)}>
        <Card className="p-5 space-y-5">
          <SectionLabel>Paresthésies</SectionLabel>
          <GradientSlider
            id="paresthesiaGlute"
            label="Fessier"
            value={form.paresthesiaGlute}
            onChange={set("paresthesiaGlute")}
            scaleLabels={["Aucune", "Légère", "Forte"]}
          />
          <Divider />
          <GradientSlider
            id="paresthesiaFoot"
            label="Pied"
            value={form.paresthesiaFoot}
            onChange={set("paresthesiaFoot")}
            scaleLabels={["Aucune", "Légère", "Forte"]}
          />
        </Card>
      </motion.div>

      {/* ── Section: Autres symptômes ── */}
      <motion.div {...fadeUp(0.14)}>
        <Card className="p-5 space-y-5">
          <SectionLabel>Autres symptômes</SectionLabel>
          <GradientSlider
            id="sacrumTension"
            label="Tension sacrum"
            value={form.sacrumTension}
            onChange={set("sacrumTension")}
            scaleLabels={["Aucune", "Modérée", "Intense"]}
          />
          <Divider />
          <GradientSlider
            id="symptomsMorning"
            label="Au lever"
            value={form.symptomsMorning}
            onChange={set("symptomsMorning")}
            scaleLabels={["Aucune", "Modérée", "Intense"]}
          />
          <Divider />
          <GradientSlider
            id="symptomsAfterSitting"
            label="Après assise"
            value={form.symptomsAfterSitting}
            onChange={set("symptomsAfterSitting")}
            scaleLabels={["Aucune", "Modérée", "Intense"]}
          />
        </Card>
      </motion.div>

      {/* ── Section: Tolérance posturale ── */}
      <motion.div {...fadeUp(0.16)}>
        <Card className="p-5">
          <SectionLabel>Tolérance posturale</SectionLabel>
          <div className="divide-y divide-stone-100">
            <StepperRow label="Assise sans douleur" value={form.sittingMaxMin} onChange={set("sittingMaxMin")} />
            <StepperRow label="Voiture sans douleur" value={form.carMaxMin} onChange={set("carMaxMin")} />
          </div>
          <div className="flex gap-2 flex-wrap mt-3">
            <ThresholdHint label="Assise" value={form.sittingMaxMin} redMax={state.rulesSettings.sittingRedMax} orangeMax={state.rulesSettings.sittingOrangeMax} />
            <ThresholdHint label="Voiture" value={form.carMaxMin} redMax={state.rulesSettings.carRedMax} orangeMax={state.rulesSettings.carOrangeMax} />
          </div>
        </Card>
      </motion.div>

      {/* ── Section: Marche ── */}
      <motion.div {...fadeUp(0.18)}>
        <Card className="p-5">
          <SectionLabel>Marche</SectionLabel>
          <div className="divide-y divide-stone-100">
            <StepperRow label="Matin" value={form.walk1Min} onChange={set("walk1Min")} />
            <StepperRow label="Après-midi" value={form.walk2Min} onChange={set("walk2Min")} />
          </div>
          <p className="text-xs text-stone-400 mt-3">
            Total : <strong className="text-stone-700">{toNumber(form.walk1Min) + toNumber(form.walk2Min)} min</strong>
          </p>
        </Card>
      </motion.div>

      {/* ── Section: Séance ── */}
      <motion.div {...fadeUp(0.2)}>
        <Card className="p-5 space-y-5">
          <SectionLabel>Séance du jour</SectionLabel>
          <div className="divide-y divide-stone-100">
            <StepperRow label="Durée" value={form.sessionDurationMin} onChange={set("sessionDurationMin")} />
          </div>
          <Divider />
          <GradientSlider
            id="sessionRpe"
            label="Effort perçu (RPE)"
            value={form.sessionRpe}
            onChange={set("sessionRpe")}
            scaleLabels={["Repos", "Modéré", "Max"]}
          />
        </Card>
      </motion.div>

      {/* ── Section: Bien-être général ── */}
      <motion.div {...fadeUp(0.22)}>
        <Card className="p-5 space-y-5">
          <SectionLabel>Bien-être général</SectionLabel>
          <GradientSlider
            id="sleep"
            label="Sommeil"
            value={form.sleep}
            onChange={set("sleep")}
            scaleLabels={["Mauvais", "Moyen", "Excellent"]}
          />
          <Divider />
          <GradientSlider
            id="dayQuality"
            label="Qualité de la journée"
            value={form.dayQuality}
            onChange={set("dayQuality")}
            scaleLabels={["Mauvaise", "Moyenne", "Excellente"]}
          />
        </Card>
      </motion.div>

      {/* ── Section: Réaction +24h ── */}
      <motion.div {...fadeUp(0.24)}>
        <Card className="p-5">
          <ReactionPicker
            label="Réaction +24h (lendemain matin)"
            value={form.reaction24h}
            onChange={set("reaction24h")}
          />
          {form.reaction24h === "worse" && (
            <div className="mt-3 flex gap-2 items-start p-3 rounded-xl bg-chaleur-50 border border-chaleur-100 text-xs text-chaleur-700">
              <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
              <span>Réaction +24h "Pire" → flare détecté, feu rouge activé.</span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── Section: Notes ── */}
      <motion.div {...fadeUp(0.26)}>
        <Card className="p-5">
          <SectionLabel>Notes libres</SectionLabel>
          <textarea
            value={form.notes}
            onChange={e => { set("notes")(e.target.value); }}
            placeholder="Observations, ressentis, contexte..."
            rows={3}
            className="w-full resize-none rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5
              text-[15px] text-stone-700 placeholder:text-stone-400
              focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent
              transition-shadow duration-150"
          />
        </Card>
      </motion.div>

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30
        bg-white/92 backdrop-blur-md border-t border-stone-200/60
        px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-lg mx-auto space-y-2">
          <AnimatePresence>
            {error && (
              <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs text-chaleur-600 font-medium text-center">
                {error}
              </motion.p>
            )}
            {saved && (
              <motion.div key="s" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5 text-xs text-teal-600 font-semibold">
                <CheckCircle2 size={13} aria-hidden /> Enregistré
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2
              bg-teal-500 hover:bg-teal-600 active:scale-[0.98]
              text-white font-bold text-[15px] rounded-2xl
              py-4 shadow-teal
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <Save size={18} aria-hidden />
            Enregistrer le bilan
          </button>
        </div>
      </div>
    </div>
  );
}
