// ============================================================
// METRICS — verbatim from script.js v1
// Every formula preserved exactly. Comments kept for traceability.
// ============================================================

import {
  VALID_EXERCISE_LEVELS,
  SESSION_LEVEL_RANK,
  SESSION_LEVEL_LABEL,
  SESSION_PROGRESSION_DELTA_THRESHOLD,
  SESSION_REGRESSION_DELTA_THRESHOLD,
  SESSION_HOLD_REP_WEIGHT,
  SESSION_LOAD_FACTOR_PER_KG,
  DEFAULT_RULES,
} from "./defaults.js";

// ── Primitive helpers ──────────────────────────────────────────

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function safe0to10(n) {
  return clamp(toNumber(n, 0), 0, 10);
}

export function round1(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

export function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function sum(arr) {
  return arr.reduce((s, v) => s + v, 0);
}

export function formatDateISO(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayISO() {
  return formatDateISO(new Date());
}

export function sortLogsByDate(logs) {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date));
}

// ── Daily log calculations ─────────────────────────────────────

export function computeWalkTotal(log) {
  return toNumber(log.walk1Min) + toNumber(log.walk2Min);
}

export function computeParesthesiaComposite(log) {
  return avg([safe0to10(log.paresthesiaGlute), safe0to10(log.paresthesiaFoot)]);
}

export function computeSymptomIndex(log) {
  // Composite: douleur 40% + paresth glute 25% + paresth pied 20% + symptômes après assise 15%
  // practical heuristic / scientific uncertainty
  const pain = safe0to10(log.pain);
  const pg = safe0to10(log.paresthesiaGlute);
  const pf = safe0to10(log.paresthesiaFoot);
  const sitSym = safe0to10(log.symptomsAfterSitting);
  return round1((pain * 0.4) + (pg * 0.25) + (pf * 0.2) + (sitSym * 0.15));
}

export function detectFlare24h(log, prevLog, rules = DEFAULT_RULES) {
  if (!log) return false;
  const ruleReaction = log.reaction24h === "worse";
  const rulePainDelta = !!prevLog && (safe0to10(log.pain) - safe0to10(prevLog.pain) >= toNumber(rules.flarePainDelta, 2));
  return ruleReaction || rulePainDelta;
}

export function computeTrafficLight(log, prevLog, rules = DEFAULT_RULES) {
  if (!log) return "GRAY";
  const pain = safe0to10(log.pain);
  const paraComposite = computeParesthesiaComposite(log);
  const sit = Math.max(0, toNumber(log.sittingMaxMin));
  const car = Math.max(0, toNumber(log.carMaxMin));
  const flare = detectFlare24h(log, prevLog, rules);

  // RED first
  if (
    flare ||
    pain >= rules.painRed ||
    paraComposite >= rules.paresthesiaRed ||
    sit <= rules.sittingRedMax ||
    car <= rules.carRedMax
  ) {
    return "RED";
  }

  // ORANGE
  if (
    log.reactionImmediate === "worse" ||
    pain >= rules.painOrange ||
    paraComposite >= rules.paresthesiaOrange ||
    sit <= rules.sittingOrangeMax ||
    car <= rules.carOrangeMax
  ) {
    return "ORANGE";
  }

  return "GREEN";
}

export function trafficRank(color) {
  const map = { GREEN: 1, ORANGE: 2, RED: 3, GRAY: 0 };
  return map[color] || 0;
}

export function computeWeekTraffic(last7Logs, getPrevFn, rules = DEFAULT_RULES) {
  if (!last7Logs.length) return "GRAY";
  let worst = "GREEN";
  const sorted = sortLogsByDate(last7Logs);
  sorted.forEach((log, i) => {
    const prev = i > 0 ? sorted[i - 1] : (getPrevFn ? getPrevFn(log.date) : null);
    const t = computeTrafficLight(log, prev, rules);
    if (trafficRank(t) > trafficRank(worst)) worst = t;
  });
  return worst;
}

export function countStableDays(sortedAllLogs, rules = DEFAULT_RULES) {
  if (!sortedAllLogs.length) return 0;
  let count = 0;
  for (let i = sortedAllLogs.length - 1; i >= 0; i--) {
    const current = sortedAllLogs[i];
    const prev = i > 0 ? sortedAllLogs[i - 1] : null;
    const traffic = computeTrafficLight(current, prev, rules);
    const flare = detectFlare24h(current, prev, rules);
    // Stable = pas de RED + pas flare ; ORANGE léger possible
    // practical heuristic / scientific uncertainty
    if (traffic === "RED" || flare) break;
    count++;
  }
  return count;
}

export function computeProgressionPossible(last7Logs, getPrevFn, sortedAllLogs, rules = DEFAULT_RULES) {
  const weekTraffic = computeWeekTraffic(last7Logs, getPrevFn, rules);
  const stableDays = countStableDays(sortedAllLogs, rules);
  return (weekTraffic === "GREEN" && stableDays >= rules.stableDaysForProgression) ? "YES" : "NO";
}

export function computeNextDayDecision(dayTraffic) {
  if (dayTraffic === "GREEN") return "Increase";
  if (dayTraffic === "ORANGE") return "Maintain";
  if (dayTraffic === "RED") return "Reduce";
  return "—";
}

export function computeTrend(sortedAllLogs) {
  if (sortedAllLogs.length < 7) return "Stable";
  const last7 = sortedAllLogs.slice(-7);
  const prev7 = sortedAllLogs.slice(-14, -7);
  const lastAvg = avg(last7.map(computeSymptomIndex));
  if (!prev7.length) return "Stable";
  const prevAvg = avg(prev7.map(computeSymptomIndex));
  const diff = lastAvg - prevAvg;
  // practical heuristic / scientific uncertainty
  if (diff <= -0.5) return "Improving";
  if (diff >= 0.5) return "Worsening";
  return "Stable";
}

export function getTrainingVolumeScore(log) {
  // practical heuristic / scientific uncertainty
  // Score de charge simple: marche totale + (durée séance * facteur RPE)
  const walk = computeWalkTotal(log);
  const dur = Math.max(0, toNumber(log.sessionDurationMin));
  const rpe = clamp(toNumber(log.sessionRpe, 0), 0, 10);
  return walk + (dur * (1 + rpe / 10));
}

// ── Alerts ────────────────────────────────────────────────────

export function computeAlerts(last7Logs, getPrevFn, sortedAllLogs, rules = DEFAULT_RULES) {
  const alerts = [];
  const sorted = sortLogsByDate(last7Logs);

  // flare >24h
  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : (getPrevFn ? getPrevFn(log.date) : null);
    if (detectFlare24h(log, prev, rules)) {
      alerts.push(`Flare >24h détecté (${log.date})`);
    }
  }

  // symptômes élevés
  const highSym = sorted.filter(l => computeSymptomIndex(l) >= rules.highSymptomIndexAlert);
  if (highSym.length >= 2) {
    alerts.push(`Symptom Index élevé sur ${highSym.length} jour(s) / 7`);
  }

  // progression trop rapide (volume semaine)
  if (sortedAllLogs.length >= 14) {
    const weekA = sortedAllLogs.slice(-7);
    const weekB = sortedAllLogs.slice(-14, -7);
    const volA = sum(weekA.map(getTrainingVolumeScore));
    const volB = sum(weekB.map(getTrainingVolumeScore));
    if (volB > 0) {
      const pct = ((volA - volB) / volB) * 100;
      if (pct > rules.fastProgressionPct) {
        alerts.push(`Progression volume rapide: +${Math.round(pct)}% (7j)`);
      }
    }
  }

  // ORANGE répété / RED
  const trafficList = sorted.map((log, i) => {
    const prev = i > 0 ? sorted[i - 1] : (getPrevFn ? getPrevFn(log.date) : null);
    return computeTrafficLight(log, prev, rules);
  });
  const orangeCount = trafficList.filter(t => t === "ORANGE").length;
  const redCount = trafficList.filter(t => t === "RED").length;
  if (redCount > 0) alerts.push("RED récent: geler progression");
  if (orangeCount >= 3) alerts.push("ORANGE répété: geler progression");

  return alerts;
}

// ── Daily log validation ───────────────────────────────────────

export function validateDailyLog(log) {
  const requiredDate = typeof log.date === "string" && log.date.length === 10;
  if (!requiredDate) return { ok: false, message: "Date invalide" };

  const zeroTenFields = [
    "sleep", "dayQuality", "pain", "paresthesiaGlute", "paresthesiaFoot",
    "sacrumTension", "symptomsMorning", "symptomsAfterSitting", "sessionRpe",
  ];
  for (const key of zeroTenFields) {
    const v = toNumber(log[key], NaN);
    if (!Number.isFinite(v) || v < 0 || v > 10) {
      return { ok: false, message: `Valeur invalide pour ${key} (0-10)` };
    }
  }

  const nonNegativeFields = ["sittingMaxMin", "carMaxMin", "walk1Min", "walk2Min", "sessionDurationMin"];
  for (const key of nonNegativeFields) {
    const v = toNumber(log[key], NaN);
    if (!Number.isFinite(v) || v < 0) {
      return { ok: false, message: `Valeur invalide pour ${key}` };
    }
  }

  const validReactions = ["better", "same", "worse"];
  if (!validReactions.includes(log.reactionImmediate) || !validReactions.includes(log.reaction24h)) {
    return { ok: false, message: "Réactions invalides" };
  }

  return { ok: true };
}

// ── Session exercise level system ─────────────────────────────

export function normalizeExerciseName(name) {
  return String(name ?? "").trim().toLowerCase();
}

export function parseLoadKg(loadValue) {
  const normalized = String(loadValue ?? "").replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : 0;
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function computeExerciseEffortCoefficient(exercise = {}) {
  const sets = Math.max(0, toNumber(exercise.sets, 0));
  const reps = Math.max(0, toNumber(exercise.reps, 0));
  const holdSec = Math.max(0, toNumber(exercise.holdSec, 0));
  const loadKg = parseLoadKg(exercise.load);
  const basePerSet = reps + (holdSec * SESSION_HOLD_REP_WEIGHT);
  const loadFactor = 1 + (loadKg * SESSION_LOAD_FACTOR_PER_KG);
  return round1(sets * basePerSet * loadFactor);
}

export function resolveExerciseBaselineLevel(exercisesLibrary, name, fallbackLevel = "standard") {
  const normalizedName = normalizeExerciseName(name);
  const fromLibrary = exercisesLibrary.find(ex => normalizeExerciseName(ex.name) === normalizedName)?.defaultLevel;
  if (VALID_EXERCISE_LEVELS.has(fromLibrary)) return fromLibrary;
  if (VALID_EXERCISE_LEVELS.has(fallbackLevel)) return fallbackLevel;
  return "standard";
}

export function aggregateSessionExerciseEntries(entries, exercisesLibrary) {
  const normalizedEntries = entries.filter(ex => ex.name);
  const fallbackLevel = normalizedEntries.reduce((currentFallback, exercise) => {
    const candidate = resolveExerciseBaselineLevel(exercisesLibrary, exercise.name, exercise.level);
    return (SESSION_LEVEL_RANK[candidate] || SESSION_LEVEL_RANK.standard) > (SESSION_LEVEL_RANK[currentFallback] || SESSION_LEVEL_RANK.standard)
      ? candidate : currentFallback;
  }, "standard");
  return {
    sets: sum(normalizedEntries.map(ex => Math.max(0, toNumber(ex.sets, 0)))),
    reps: normalizedEntries.reduce((maxReps, ex) => Math.max(maxReps, Math.max(0, toNumber(ex.reps, 0))), 0),
    holdSec: normalizedEntries.reduce((maxHold, ex) => Math.max(maxHold, Math.max(0, toNumber(ex.holdSec, 0))), 0),
    effortCoeff: round1(sum(normalizedEntries.map(computeExerciseEffortCoefficient))),
    fallbackLevel,
  };
}

export function deriveExerciseAutoLevelState(exerciseName, aggregate, reference, exercisesLibrary, fallbackLevel = "standard") {
  const baseLevel = resolveExerciseBaselineLevel(exercisesLibrary, exerciseName, aggregate?.fallbackLevel || fallbackLevel);
  const currentCoeff = round1(toNumber(aggregate?.effortCoeff, 0));
  const referenceCoeff = reference ? round1(toNumber(reference.effortCoeff, 0)) : null;

  if (!reference || !referenceCoeff) {
    return {
      level: baseLevel,
      levelScore: SESSION_LEVEL_RANK[baseLevel] || SESSION_LEVEL_RANK.standard,
      currentCoeff,
      referenceCoeff,
      deltaPct: null,
      referenceDate: "",
      reason: "baseline",
    };
  }

  const deltaRatio = referenceCoeff > 0 ? ((currentCoeff / referenceCoeff) - 1) : 0;
  let level = "standard";
  if (deltaRatio >= SESSION_PROGRESSION_DELTA_THRESHOLD) level = "progression";
  else if (deltaRatio <= SESSION_REGRESSION_DELTA_THRESHOLD) level = "regression";

  return {
    level,
    levelScore: SESSION_LEVEL_RANK[level] || SESSION_LEVEL_RANK.standard,
    currentCoeff,
    referenceCoeff,
    deltaPct: round1(deltaRatio * 100),
    referenceDate: reference.date,
    reason: "comparison",
  };
}

export function formatSessionProgressDate(dateStr, includeYear = false) {
  if (typeof dateStr !== "string" || dateStr.length !== 10) return "—";
  const [yyyy, mm, dd] = dateStr.split("-");
  return includeYear ? `${dd}/${mm}/${yyyy}` : `${dd}/${mm}`;
}

export function formatSessionMetricValue(metric, value) {
  if (metric === "level") {
    return SESSION_LEVEL_LABEL[Math.round(toNumber(value, SESSION_LEVEL_RANK.standard))] || "standard";
  }
  if (metric === "holdSec") return `${Math.round(toNumber(value, 0))} s`;
  return String(Math.round(toNumber(value, 0)));
}

export function formatSessionMetricDelta(metric, currentValue, previousValue) {
  if (previousValue === null || previousValue === undefined) return "Première entrée";
  if (metric === "level") {
    if (currentValue === previousValue) return "Stable";
    return `${formatSessionMetricValue(metric, previousValue)} → ${formatSessionMetricValue(metric, currentValue)}`;
  }
  const diff = round1(currentValue - previousValue);
  if (diff === 0) return "Stable";
  const absDiff = Math.abs(diff);
  const suffix = metric === "holdSec" ? " s" : "";
  return `${diff > 0 ? "+" : "-"}${absDiff}${suffix}`;
}
