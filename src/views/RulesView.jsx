import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2, RotateCcw, Info } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { cloneDefaultRules, cloneDefaultInfoTexts } from "../lib/storage.js";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.45, ease: "easeOut", delay },
});

function RuleField({ label, hint, value, onChange, min = 0, step = 1, suffix }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 text-sm font-bold text-right text-slate-900 bg-slate-50 border border-slate-200 rounded-xl
            px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-xs text-slate-400 w-6">{suffix}</span>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
      {children}
    </h3>
  );
}

function InfoTextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={5}
        className="w-full resize-none text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
          px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
          transition-shadow duration-150"
      />
    </div>
  );
}

export function RulesView({ state, saveRules, saveInfoTexts }) {
  const [rules, setRules] = useState(() => ({ ...state.rulesSettings }));
  const [texts, setTexts] = useState(() => ({ ...state.infoTexts }));
  const [rulesSaved, setRulesSaved] = useState(false);
  const [textsSaved, setTextsSaved] = useState(false);

  const setRule = (key) => (val) => {
    setRules(r => ({ ...r, [key]: val }));
    setRulesSaved(false);
  };

  const setText = (key) => (val) => {
    setTexts(t => ({ ...t, [key]: val }));
    setTextsSaved(false);
  };

  const handleSaveRules = () => {
    saveRules(rules);
    setRulesSaved(true);
    try { navigator.vibrate?.([10, 30, 10]); } catch {}
    setTimeout(() => setRulesSaved(false), 3000);
  };

  const handleSaveTexts = () => {
    saveInfoTexts(texts);
    setTextsSaved(true);
    try { navigator.vibrate?.([10, 30, 10]); } catch {}
    setTimeout(() => setTextsSaved(false), 3000);
  };

  const resetRules = () => {
    if (!confirm("Réinitialiser les règles aux valeurs par défaut ?")) return;
    setRules(cloneDefaultRules());
    setRulesSaved(false);
  };

  const resetTexts = () => {
    if (!confirm("Réinitialiser les textes aux valeurs par défaut ?")) return;
    setTexts(cloneDefaultInfoTexts());
    setTextsSaved(false);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Disclaimer */}
      <motion.div {...fadeUp(0)}>
        <div className="flex gap-2.5 items-start p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p>Ces seuils sont des conventions de suivi personnel, pas des seuils médicaux universels. Modifie-les uniquement si tu comprends leur impact sur les feux de trafic.</p>
        </div>
      </motion.div>

      {/* Pain thresholds */}
      <motion.div {...fadeUp(0.06)}>
        <Card className="p-4">
          <SectionTitle>Seuils de douleur</SectionTitle>
          <RuleField
            label="Douleur → ROUGE"
            hint="Si douleur ≥ cette valeur → feu rouge"
            value={rules.painRed}
            onChange={setRule("painRed")}
            suffix="/10"
          />
          <RuleField
            label="Douleur → ORANGE"
            hint="Si douleur ≥ cette valeur → feu orange"
            value={rules.painOrange}
            onChange={setRule("painOrange")}
            suffix="/10"
          />
          <RuleField
            label="Paresthésies → ROUGE"
            hint="Si composite fessier+pied ≥ cette valeur → rouge"
            value={rules.paresthesiaRed}
            onChange={setRule("paresthesiaRed")}
            suffix="/10"
          />
          <RuleField
            label="Paresthésies → ORANGE"
            value={rules.paresthesiaOrange}
            onChange={setRule("paresthesiaOrange")}
            suffix="/10"
          />
        </Card>
      </motion.div>

      {/* Sitting / car thresholds */}
      <motion.div {...fadeUp(0.10)}>
        <Card className="p-4">
          <SectionTitle>Tolérance posturale</SectionTitle>
          <RuleField
            label="Assise max ≤ → ROUGE"
            hint="Si max tolérée ≤ ce seuil → feu rouge"
            value={rules.sittingRedMax}
            onChange={setRule("sittingRedMax")}
            step={5}
            suffix="min"
          />
          <RuleField
            label="Assise max ≤ → ORANGE"
            value={rules.sittingOrangeMax}
            onChange={setRule("sittingOrangeMax")}
            step={5}
            suffix="min"
          />
          <RuleField
            label="Voiture max ≤ → ROUGE"
            value={rules.carRedMax}
            onChange={setRule("carRedMax")}
            step={5}
            suffix="min"
          />
          <RuleField
            label="Voiture max ≤ → ORANGE"
            value={rules.carOrangeMax}
            onChange={setRule("carOrangeMax")}
            step={5}
            suffix="min"
          />
        </Card>
      </motion.div>

      {/* Progression rules */}
      <motion.div {...fadeUp(0.14)}>
        <Card className="p-4">
          <SectionTitle>Progression & Flare</SectionTitle>
          <RuleField
            label="Jours stables requis pour progression"
            hint="Nombre de jours consécutifs non-RED sans flare"
            value={rules.stableDaysForProgression}
            onChange={setRule("stableDaysForProgression")}
            suffix="j"
          />
          <RuleField
            label="Delta douleur → flare >24h"
            hint="Si douleur augmente d'au moins N vs la veille → flare détecté"
            value={rules.flarePainDelta}
            onChange={setRule("flarePainDelta")}
            suffix="/10"
          />
          <RuleField
            label="Réduction mauvais jour — min"
            hint="Volume réduit de X% les jours RED"
            value={rules.badDayReductionMinPct}
            onChange={setRule("badDayReductionMinPct")}
            suffix="%"
          />
          <RuleField
            label="Réduction mauvais jour — max"
            value={rules.badDayReductionMaxPct}
            onChange={setRule("badDayReductionMaxPct")}
            suffix="%"
          />
          <RuleField
            label="Alerte Symptom Index élevé"
            hint="Si index ≥ cette valeur sur 2j+/7 → alerte"
            value={rules.highSymptomIndexAlert}
            onChange={setRule("highSymptomIndexAlert")}
            step={0.5}
            suffix="/10"
          />
          <RuleField
            label="Progression rapide volume (alerte)"
            hint="Si volume semaine +N% vs semaine précédente → alerte"
            value={rules.fastProgressionPct}
            onChange={setRule("fastProgressionPct")}
            suffix="%"
          />
        </Card>
      </motion.div>

      {/* Rules save */}
      <motion.div {...fadeUp(0.18)}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveRules}
            className="flex-1 flex items-center justify-center gap-2
              bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]
              text-white font-bold text-sm rounded-2xl py-3
              shadow-lg shadow-emerald-500/20 transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            {rulesSaved ? <><CheckCircle2 size={16} aria-hidden /> Enregistré</> : <><Save size={16} aria-hidden /> Sauvegarder les règles</>}
          </button>
          <button
            type="button"
            onClick={resetRules}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-600
              hover:bg-slate-50 font-semibold text-sm transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label="Réinitialiser les règles"
          >
            <RotateCcw size={15} aria-hidden />
          </button>
        </div>
      </motion.div>

      {/* Info texts */}
      <motion.div {...fadeUp(0.22)}>
        <Card className="p-4 space-y-4">
          <SectionTitle>Textes d'information</SectionTitle>
          <InfoTextArea
            label="Reconsulter (non urgent)"
            value={texts.nonUrgent}
            onChange={setText("nonUrgent")}
          />
          <InfoTextArea
            label="Red flags (urgence)"
            value={texts.redFlags}
            onChange={setText("redFlags")}
          />
        </Card>
      </motion.div>

      <motion.div {...fadeUp(0.26)}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveTexts}
            className="flex-1 flex items-center justify-center gap-2
              bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]
              text-white font-bold text-sm rounded-2xl py-3
              shadow-lg shadow-emerald-500/20 transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            {textsSaved ? <><CheckCircle2 size={16} aria-hidden /> Enregistré</> : <><Save size={16} aria-hidden /> Sauvegarder les textes</>}
          </button>
          <button
            type="button"
            onClick={resetTexts}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-600
              hover:bg-slate-50 font-semibold text-sm transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label="Réinitialiser les textes"
          >
            <RotateCcw size={15} aria-hidden />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
