import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, TrendingUp, TrendingDown, Minus, Calendar, Dumbbell, ChevronRight, ArrowRight } from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import {
  sortLogsByDate, computeSymptomIndex, computeParesthesiaComposite,
  computeTrafficLight, computeWeekTraffic, computeProgressionPossible,
  computeNextDayDecision, computeTrend, computeAlerts, getTrainingVolumeScore,
  computeWalkTotal, safe0to10, round1, avg, toNumber, countStableDays,
  detectFlare24h, formatDateISO, todayISO,
} from "../lib/metrics.js";

// v2 components
import { Card }        from "../components/v2/Card.jsx";
import { MetricCard }  from "../components/v2/MetricCard.jsx";
import { StatusBadge } from "../components/v2/StatusBadge.jsx";
import { Pill }        from "../components/v2/Pill.jsx";
import { Button }      from "../components/v2/Button.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// ── Helpers ───────────────────────────────────────────────────────

const FR_DAY  = ["D", "L", "M", "M", "J", "V", "S"];
const FR_MONTH = ["janvier", "février", "mars", "avril", "mai", "juin",
                  "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const FR_DAY_LONG = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function readableDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${FR_DAY_LONG[d.getDay()]} ${d.getDate()} ${FR_MONTH[d.getMonth()]}`;
}

function contextMessage(dayTraffic, progressPossible, stableDays, requiredDays, rules) {
  if (dayTraffic === "RED") return {
    title: "La douleur est plus forte.",
    body:  `Réduisez le volume de ${rules.badDayReductionMinPct}–${rules.badDayReductionMaxPct} %. Priorité : mobilité douce + marche.`,
    cta:   null,
  };
  if (dayTraffic === "ORANGE") return {
    title: "Signal modéré.",
    body:  "Maintenez le volume d'aujourd'hui. Ne progressez pas.",
    cta:   null,
  };
  if (progressPossible === "YES") return {
    title: `Signaux stables depuis ${stableDays} jours.`,
    body:  "Vous pouvez progresser doucement — une variable à la fois.",
    cta:   "Voir la séance du jour",
  };
  const remaining = Math.max(0, requiredDays - stableDays);
  return {
    title: "Bonne tolérance.",
    body:  remaining > 0
      ? `Encore ${remaining} jour${remaining > 1 ? "s" : ""} stable${remaining > 1 ? "s" : ""} avant de pouvoir progresser.`
      : "Maintenez le rythme.",
    cta: "Voir la séance du jour",
  };
}

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { labels: { font: { size: 11, family: "Inter" }, color: "#78716C" } },
    tooltip: { bodyFont: { family: "Inter" }, titleFont: { family: "Inter" } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#A8A29E", font: { size: 10 } } },
    y: { grid: { color: "rgba(168,162,158,0.12)" }, ticks: { color: "#A8A29E", font: { size: 10 } } },
  },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.3, ease: "easeOut", delay },
});

// ── Sub-components ─────────────────────────────────────────────────

function WeekStrip({ sorted, getPrevFn, rulesSettings }) {
  const today = todayISO();
  const days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = formatDateISO(d);
      const log = sorted.find(l => l.date === dateStr) ?? null;
      let traffic = "GRAY";
      if (log) {
        const prev = getPrevFn(dateStr);
        traffic = computeTrafficLight(log, prev, rulesSettings);
      }
      result.push({ dateStr, letter: FR_DAY[d.getDay()], num: d.getDate(), traffic, isToday: dateStr === today });
    }
    return result;
  }, [sorted, getPrevFn, rulesSettings, today]);

  const dotColor = { GREEN: "bg-teal-400", ORANGE: "bg-amber-400", RED: "bg-chaleur-400", GRAY: "bg-stone-200" };

  return (
    <div className="flex items-end justify-between px-1" role="list" aria-label="7 derniers jours">
      {days.map(day => (
        <div key={day.dateStr} className="flex flex-col items-center gap-1.5" role="listitem">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${day.isToday ? "text-teal-600" : "text-stone-400"}`}>
            {day.letter}
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center
            ${day.isToday ? "bg-teal-100 ring-2 ring-teal-400" : ""}`}>
            <span className={`text-xs font-semibold tabular-nums ${day.isToday ? "text-teal-700" : "text-stone-600"}`}>
              {day.num}
            </span>
          </div>
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor[day.traffic]}`} aria-hidden />
        </div>
      ))}
    </div>
  );
}

function FlareUpBanner({ rules, onDismiss }) {
  return (
    <motion.div {...fadeUp(0)}>
      <div className="rounded-2xl bg-chaleur-50 border border-chaleur-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-chaleur-200 flex items-center justify-center shrink-0">
            <AlertTriangle size={11} className="text-chaleur-700" aria-hidden />
          </span>
          <p className="text-[11px] font-bold text-chaleur-600 uppercase tracking-widest">Flare-up détecté</p>
        </div>
        <p className="text-[15px] font-semibold text-chaleur-900 leading-snug">
          La douleur est plus forte depuis hier. Allégez la journée.
        </p>
        <p className="text-sm text-chaleur-700">
          Volume réduit de {rules.badDayReductionMinPct}–{rules.badDayReductionMaxPct} %.
          Exercices remplacés par mobilité douce et marche courte.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm font-semibold text-chaleur-600 underline underline-offset-2
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chaleur-400"
        >
          Ignorer
        </button>
      </div>
    </motion.div>
  );
}

function HeroCard({ msg, onCta }) {
  const bgColor = {
    GREEN:  "bg-white",
    ORANGE: "bg-amber-50/60",
    RED:    "bg-chaleur-50/60",
    GRAY:   "bg-white",
  };

  return (
    <Card className="p-5 space-y-3">
      <p className="text-[17px] font-semibold text-stone-900 leading-snug">{msg.title}</p>
      <p className="text-[14px] text-stone-500 leading-relaxed">{msg.body}</p>
      {msg.cta && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center gap-2 mt-1
            bg-teal-500 text-white text-sm font-semibold
            px-5 py-2.5 rounded-full
            hover:bg-teal-600 active:scale-[.97]
            transition-all duration-200 shadow-teal
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          {msg.cta}
          <ArrowRight size={14} aria-hidden />
        </button>
      )}
    </Card>
  );
}

function TodaySection({ sessionLogs, date, onTabChange }) {
  const todaySession = useMemo(
    () => sessionLogs.find(s => s.date === date),
    [sessionLogs, date]
  );

  if (!todaySession?.exercises?.length) return null;

  const totalMin = toNumber(
    useMemo(() => {
      // sum hold times as proxy if no duration; otherwise show exercise count
      return null;
    }, [])
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Aujourd'hui</p>
        <span className="text-[11px] font-bold text-teal-600">{todaySession.exercises.length} exercice{todaySession.exercises.length > 1 ? "s" : ""}</span>
      </div>
      <button
        type="button"
        onClick={() => onTabChange("session")}
        className="w-full flex items-center gap-3 bg-white rounded-2xl border border-stone-200/70 shadow-card
          px-4 py-3.5 hover:shadow-card-hover hover:-translate-y-px
          transition-all duration-200 text-left
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <span className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
          <Dumbbell size={16} className="text-teal-600" aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-stone-900 truncate">Séance du jour</p>
          <p className="text-xs text-stone-400">{todaySession.exercises.length} exos enregistrés</p>
        </div>
        <ChevronRight size={16} className="text-stone-300 shrink-0" aria-hidden />
      </button>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────

export function DashboardView({ state, onTabChange }) {
  const { dailyLogs, rulesSettings, sessionLogs } = state;
  const today = todayISO();

  const sorted  = useMemo(() => sortLogsByDate(dailyLogs), [dailyLogs]);
  const last7   = useMemo(() => sorted.slice(-7),  [sorted]);
  const last28  = useMemo(() => sorted.slice(-28), [sorted]);

  const getPrevFn = useMemo(() => (dateStr) => {
    const idx = sorted.findIndex(l => l.date === dateStr);
    return idx > 0 ? sorted[idx - 1] : null;
  }, [sorted]);

  const last = last7[last7.length - 1];
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  // ── Computed metrics (logique identique à v1) ──
  const pain7     = last7.length ? round1(avg(last7.map(l => safe0to10(l.pain)))) : null;
  const para7     = last7.length ? round1(avg(last7.map(l => computeParesthesiaComposite(l)))) : null;
  const sit7      = last7.length ? Math.round(avg(last7.map(l => Math.max(0, toNumber(l.sittingMaxMin))))) : null;
  const walkToday = last ? computeWalkTotal(last) : null;
  const sessions7 = last7.filter(l => toNumber(l.sessionDurationMin) > 0).length;

  const dayTraffic      = last ? computeTrafficLight(last, prev, rulesSettings) : "GRAY";
  const weekTraffic     = computeWeekTraffic(last7, getPrevFn, rulesSettings);
  const stableDays      = countStableDays(sorted, rulesSettings);
  const progressPossible = computeProgressionPossible(last7, getPrevFn, sorted, rulesSettings);
  const trend           = computeTrend(sorted);
  const alerts          = computeAlerts(last7, getPrevFn, sorted, rulesSettings);
  const hasFlare        = last ? detectFlare24h(last, prev, rulesSettings) : false;

  // ── Day/week counter ──
  const dayNumber  = sorted.length;
  const weekNumber = Math.max(1, Math.ceil(dayNumber / 7));

  // ── Sparkline data ──
  const painSpark = last7.map(l => safe0to10(l.pain));
  const paraSpark = last7.map(l => computeParesthesiaComposite(l));
  const sitSpark  = last7.map(l => Math.max(0, toNumber(l.sittingMaxMin)));
  const walkSpark = last7.map(l => computeWalkTotal(l));

  // ── Chart data (28j) ──
  const labels28       = last28.map(l => l.date.slice(5));
  const painData28     = last28.map(l => safe0to10(l.pain));
  const symptomData28  = last28.map(l => computeSymptomIndex(l));
  const sitData28      = last28.map(l => Math.max(0, toNumber(l.sittingMaxMin)));
  const carData28      = last28.map(l => Math.max(0, toNumber(l.carMaxMin)));
  const walkData28     = last28.map(l => computeWalkTotal(l));
  const sessionData28  = last28.map(l => Math.max(0, toNumber(l.sessionDurationMin)));
  const volumeData28   = last28.map(l => round1(getTrainingVolumeScore(l)));

  const msg = contextMessage(dayTraffic, progressPossible, stableDays, rulesSettings.stableDaysForProgression, rulesSettings);

  const trendIcon =
    trend === "Improving" ? <TrendingUp  size={14} className="text-teal-500" /> :
    trend === "Worsening" ? <TrendingDown size={14} className="text-chaleur-500" /> :
    <Minus size={14} className="text-stone-400" />;

  // ── Empty state ──
  if (!last7.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-400 gap-3">
        <Calendar size={40} className="opacity-40" />
        <p className="text-sm font-medium text-center">
          Aucune donnée — ajoute ton premier jour dans "Daily Entry"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2
        w-[500px] h-[300px] bg-teal-50/60 rounded-full blur-[80px] -z-10" />

      {/* Greeting row */}
      <motion.div {...fadeUp(0)}>
        <div className="flex items-start justify-between gap-2 px-1 pt-1">
          <div>
            <p className="text-[13px] font-medium text-stone-400">{readableDate(last?.date ?? today)}</p>
            <p className="text-2xl font-fraunces font-semibold text-stone-900 mt-0.5">Bonjour</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 pt-1">
            <StatusBadge status={dayTraffic} size="sm" />
            <p className="text-[11px] text-stone-400 font-medium">
              Jour {dayNumber} · sem. {weekNumber}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Flare-up banner (si détecté) */}
      <AnimatePresence>
        {hasFlare && (
          <FlareUpBanner
            rules={rulesSettings}
            onDismiss={() => {}} // logique de dismiss non-persistée intentionnellement
          />
        )}
      </AnimatePresence>

      {/* Hero contextual card */}
      <motion.div {...fadeUp(0.06)}>
        <HeroCard msg={msg} onCta={() => onTabChange?.("session")} />
      </motion.div>

      {/* 2×2 Metric grid */}
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Douleur 7j"
          value={pain7 ?? "—"} unit="/10"
          sparkData={painSpark} sparkColor="#C98A6B"
          trend={painSpark.length > 1 ? (painSpark.at(-1) < painSpark[0] ? "down" : painSpark.at(-1) > painSpark[0] ? "up" : "flat") : undefined}
        />
        <MetricCard
          label="Paresthésies 7j"
          value={para7 ?? "—"} unit="/10"
          sparkData={paraSpark} sparkColor="#D39A77"
          trend={paraSpark.length > 1 ? (paraSpark.at(-1) < paraSpark[0] ? "down" : paraSpark.at(-1) > paraSpark[0] ? "up" : "flat") : undefined}
        />
        <MetricCard
          label="Assise max moy."
          value={sit7 ?? "—"} unit="min"
          sparkData={sitSpark} sparkColor="#3D9B8E"
          trend={sitSpark.length > 1 ? (sitSpark.at(-1) > sitSpark[0] ? "up" : sitSpark.at(-1) < sitSpark[0] ? "down" : "flat") : undefined}
        />
        <MetricCard
          label="Marche totale"
          value={walkToday ?? "—"} unit="min"
          sparkData={walkSpark} sparkColor="#4A9468"
          trend={walkSpark.length > 1 ? (walkSpark.at(-1) > walkSpark[0] ? "up" : walkSpark.at(-1) < walkSpark[0] ? "down" : "flat") : undefined}
        />
      </motion.div>

      {/* Weekly calendar strip */}
      <motion.div {...fadeUp(0.14)}>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Cette semaine</p>
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-teal-600">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                {last7.filter((l, i) => {
                  const p = i > 0 ? last7[i-1] : getPrevFn(l.date);
                  return computeTrafficLight(l, p, rulesSettings) === "GREEN";
                }).length} verts
              </span>
              <span className="text-stone-300">·</span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                {last7.filter((l, i) => {
                  const p = i > 0 ? last7[i-1] : getPrevFn(l.date);
                  return computeTrafficLight(l, p, rulesSettings) === "ORANGE";
                }).length} ambres
              </span>
            </div>
          </div>
          <WeekStrip sorted={sorted} getPrevFn={getPrevFn} rulesSettings={rulesSettings} />
        </Card>
      </motion.div>

      {/* Status summary row (feu semaine + progression + séances) */}
      <motion.div {...fadeUp(0.18)} className="grid grid-cols-3 gap-3">
        <Card className="p-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Feu semaine</p>
          <StatusBadge status={weekTraffic} size="sm" />
        </Card>
        <Card className="p-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Progression</p>
          <Pill color={progressPossible} size="sm">{progressPossible}</Pill>
        </Card>
        <Card className="p-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Séances 7j</p>
          <span className="text-xl font-fraunces font-semibold text-stone-900 tabular-nums">{sessions7}</span>
        </Card>
      </motion.div>

      {/* Today's session */}
      <motion.div {...fadeUp(0.2)}>
        <TodaySection sessionLogs={sessionLogs} date={today} onTabChange={onTabChange} />
      </motion.div>

      {/* Alerts (compact chips) */}
      {alerts.length > 0 && (
        <motion.div {...fadeUp(0.22)}>
          <Card className="p-4 space-y-2">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Alertes</p>
            <ul className="flex flex-col gap-1.5">
              {alerts.map((a, i) => {
                const isRed = a.includes("RED") || a.includes("Flare") || a.includes("flare");
                return (
                  <li
                    key={i}
                    className={`flex items-start gap-2 text-[13px] rounded-xl px-3 py-2.5
                      ${isRed ? "bg-chaleur-50 text-chaleur-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
                    {a}
                  </li>
                );
              })}
            </ul>
          </Card>
        </motion.div>
      )}

      {/* Trend line */}
      <motion.div {...fadeUp(0.24)}>
        <div className="flex items-center gap-2 px-1">
          {trendIcon}
          <span className="text-[13px] text-stone-500 font-medium">Tendance : <strong className="text-stone-700">{trend}</strong></span>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div {...fadeUp(0.26)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm font-semibold text-stone-700 mb-3">Douleur & Symptom Index (28j)</p>
          <div style={{ height: 200 }}>
            <Line
              data={{
                labels: labels28,
                datasets: [
                  { label: "Douleur", data: painData28, borderColor: "#C98A6B", backgroundColor: "rgba(201,138,107,0.08)", fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                  { label: "Symptom Index", data: symptomData28, borderColor: "#F59E0B", backgroundColor: "rgba(245,158,11,0.06)", fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                ],
              }}
              options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, min: 0, max: 10 } } }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-stone-700 mb-3">Assise / Voiture (28j)</p>
          <div style={{ height: 200 }}>
            <Line
              data={{
                labels: labels28,
                datasets: [
                  { label: "Assise max (min)", data: sitData28, borderColor: "#3D9B8E", backgroundColor: "rgba(61,155,142,0.08)", fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                  { label: "Voiture max (min)", data: carData28, borderColor: "#7C9BB5", backgroundColor: "rgba(124,155,181,0.06)", fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                ],
              }}
              options={CHART_OPTS}
            />
          </div>
        </Card>
      </motion.div>

      <motion.div {...fadeUp(0.3)}>
        <Card className="p-4">
          <p className="text-sm font-semibold text-stone-700 mb-3">Volume (marche + séance, 28j)</p>
          <div style={{ height: 200 }}>
            <Bar
              data={{
                labels: labels28,
                datasets: [
                  { label: "Marche (min)",  data: walkData28,    backgroundColor: "rgba(74,148,104,0.45)", borderRadius: 3 },
                  { label: "Séance (min)",  data: sessionData28, backgroundColor: "rgba(61,155,142,0.45)", borderRadius: 3 },
                  { label: "Volume score",  data: volumeData28, type: "line", borderColor: "#C98A6B", backgroundColor: "transparent", tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, yAxisID: "y1" },
                ],
              }}
              options={{
                ...CHART_OPTS,
                scales: {
                  ...CHART_OPTS.scales,
                  x:  { ...CHART_OPTS.scales.x, stacked: true },
                  y:  { ...CHART_OPTS.scales.y, stacked: true },
                  y1: { position: "right", grid: { display: false }, ticks: { color: "#A8A29E", font: { size: 10 } } },
                },
              }}
            />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
