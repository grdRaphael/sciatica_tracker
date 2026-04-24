// ============================================================
// STORAGE — localStorage wrapper + state normalization
// Schema must stay 100% compatible with v1 exports.
// ============================================================

import {
  STORAGE_KEY,
  VALID_EXERCISE_LEVELS,
  DEFAULT_EXERCISES_LIBRARY,
  DEFAULT_RULES,
  DEFAULT_INFO_TEXTS,
  DEFAULT_PLAN_4WEEKS,
} from "./defaults.js";
import { toNumber, sortLogsByDate, normalizeExerciseName } from "./metrics.js";

// ── Cloners ───────────────────────────────────────────────────

export function cloneDefaultExercisesLibrary() {
  return DEFAULT_EXERCISES_LIBRARY.map(e => ({ ...e }));
}
export function cloneDefaultRules() { return { ...DEFAULT_RULES }; }
export function cloneDefaultPlan4Weeks() { return DEFAULT_PLAN_4WEEKS.map(w => ({ ...w })); }
export function cloneDefaultInfoTexts() { return { ...DEFAULT_INFO_TEXTS }; }

function daysAgoISO(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Default daily logs: 7-day sample for demo purposes
function buildDefaultDailyLogs() {
  return [
    { date: daysAgoISO(6), sleep: 6, dayQuality: 5, pain: 4, paresthesiaGlute: 4, paresthesiaFoot: 2, sacrumTension: 4, symptomsMorning: 4, symptomsAfterSitting: 5, sittingMaxMin: 25, carMaxMin: 15, walk1Min: 15, walk2Min: 20, sessionDurationMin: 20, sessionRpe: 4, reactionImmediate: "same", reaction24h: "same", notes: "Journée moyenne, voiture sensible" },
    { date: daysAgoISO(5), sleep: 7, dayQuality: 6, pain: 4, paresthesiaGlute: 3, paresthesiaFoot: 2, sacrumTension: 3, symptomsMorning: 3, symptomsAfterSitting: 4, sittingMaxMin: 28, carMaxMin: 18, walk1Min: 20, walk2Min: 20, sessionDurationMin: 22, sessionRpe: 4, reactionImmediate: "better", reaction24h: "same", notes: "Marche bonne" },
    { date: daysAgoISO(4), sleep: 6, dayQuality: 5, pain: 5, paresthesiaGlute: 4, paresthesiaFoot: 3, sacrumTension: 4, symptomsMorning: 4, symptomsAfterSitting: 5, sittingMaxMin: 22, carMaxMin: 12, walk1Min: 15, walk2Min: 15, sessionDurationMin: 18, sessionRpe: 5, reactionImmediate: "worse", reaction24h: "worse", notes: "Flare léger après posture prolongée" },
    { date: daysAgoISO(3), sleep: 5, dayQuality: 4, pain: 4, paresthesiaGlute: 3, paresthesiaFoot: 2, sacrumTension: 4, symptomsMorning: 4, symptomsAfterSitting: 4, sittingMaxMin: 20, carMaxMin: 10, walk1Min: 20, walk2Min: 10, sessionDurationMin: 12, sessionRpe: 3, reactionImmediate: "same", reaction24h: "same", notes: "Mauvais jour géré sans repartir à zéro" },
    { date: daysAgoISO(2), sleep: 7, dayQuality: 6, pain: 3, paresthesiaGlute: 3, paresthesiaFoot: 1, sacrumTension: 3, symptomsMorning: 3, symptomsAfterSitting: 4, sittingMaxMin: 30, carMaxMin: 20, walk1Min: 20, walk2Min: 20, sessionDurationMin: 25, sessionRpe: 4, reactionImmediate: "same", reaction24h: "better", notes: "Retour au calme" },
    { date: daysAgoISO(1), sleep: 7, dayQuality: 6, pain: 3, paresthesiaGlute: 2, paresthesiaFoot: 1, sacrumTension: 3, symptomsMorning: 2, symptomsAfterSitting: 3, sittingMaxMin: 32, carMaxMin: 20, walk1Min: 20, walk2Min: 25, sessionDurationMin: 25, sessionRpe: 4, reactionImmediate: "better", reaction24h: "same", notes: "Bonne tolérance générale" },
    { date: daysAgoISO(0), sleep: 7, dayQuality: 7, pain: 3, paresthesiaGlute: 2, paresthesiaFoot: 1, sacrumTension: 2, symptomsMorning: 2, symptomsAfterSitting: 3, sittingMaxMin: 35, carMaxMin: 22, walk1Min: 25, walk2Min: 25, sessionDurationMin: 28, sessionRpe: 4, reactionImmediate: "same", reaction24h: "same", notes: "Progression lente OK" },
  ];
}

function buildDefaultSessionLogs() {
  return [
    {
      date: daysAgoISO(0),
      exercises: [
        { name: "Cat-camel", category: "Mobility", level: "regression", sets: 2, reps: 8, holdSec: 0, tempo: "slow", load: "", notes: "" },
        { name: "Bridge light", category: "Strength", level: "regression", sets: 2, reps: 10, holdSec: 2, tempo: "2-1-2", load: "", notes: "" },
        { name: "Clamshell", category: "Glute", level: "regression", sets: 2, reps: 12, holdSec: 1, tempo: "2-1-2", load: "", notes: "" },
      ],
    },
  ];
}

// ── Normalization ─────────────────────────────────────────────

export function normalizeExerciseLibraryEntry(exercise = {}) {
  return {
    name: String(exercise?.name ?? "").trim(),
    category: String(exercise?.category ?? "").trim(),
    defaultLevel: VALID_EXERCISE_LEVELS.has(exercise?.defaultLevel) ? exercise.defaultLevel : "standard",
  };
}

export function normalizeSessionExercise(exercise = {}) {
  return {
    name: String(exercise?.name ?? "").trim(),
    category: String(exercise?.category ?? "").trim(),
    level: VALID_EXERCISE_LEVELS.has(exercise?.level) ? exercise.level : "standard",
    sets: Math.max(0, toNumber(exercise?.sets, 0)),
    reps: Math.max(0, toNumber(exercise?.reps, 0)),
    holdSec: Math.max(0, toNumber(exercise?.holdSec, 0)),
    tempo: String(exercise?.tempo ?? "").trim(),
    load: String(exercise?.load ?? "").trim(),
    notes: String(exercise?.notes ?? "").trim(),
  };
}

function normalizeSessionLogs(sessionLogs = []) {
  return sessionLogs
    .filter(s => typeof s?.date === "string" && s.date.length === 10)
    .map(s => ({
      date: s.date,
      title: String(s?.title ?? "").trim(),
      exercises: Array.isArray(s.exercises)
        ? s.exercises.map(normalizeSessionExercise).filter(ex => ex.name)
        : [],
    }));
}

export function mergeExercisesIntoLibrary(library, exercises) {
  let changed = false;
  exercises.forEach(exercise => {
    const entry = normalizeExerciseLibraryEntry({
      name: exercise?.name,
      category: exercise?.category,
      defaultLevel: exercise?.defaultLevel || exercise?.level,
    });
    if (!entry.name) return;
    const existing = library.find(ex => normalizeExerciseName(ex.name) === normalizeExerciseName(entry.name));
    if (existing) {
      if (existing.name !== entry.name) { existing.name = entry.name; changed = true; }
      if (!existing.category && entry.category) { existing.category = entry.category; changed = true; }
      if (!existing.defaultLevel && entry.defaultLevel) { existing.defaultLevel = entry.defaultLevel; changed = true; }
      return;
    }
    library.push(entry);
    changed = true;
  });
  return changed;
}

function normalizeExercisesLibrary(library = []) {
  const out = [];
  mergeExercisesIntoLibrary(out, library);
  return out;
}

// ── Build state from raw data ──────────────────────────────────

export function buildState(source = {}) {
  const nextState = {
    dailyLogs: Array.isArray(source.dailyLogs) ? source.dailyLogs : buildDefaultDailyLogs(),
    sessionLogs: Array.isArray(source.sessionLogs) ? normalizeSessionLogs(source.sessionLogs) : buildDefaultSessionLogs(),
    exercisesLibrary: Array.isArray(source.exercisesLibrary) ? normalizeExercisesLibrary(source.exercisesLibrary) : cloneDefaultExercisesLibrary(),
    rulesSettings: { ...cloneDefaultRules(), ...(source.rulesSettings || {}) },
    plan4Weeks: Array.isArray(source.plan4Weeks) ? source.plan4Weeks : cloneDefaultPlan4Weeks(),
    infoTexts: { ...cloneDefaultInfoTexts(), ...(source.infoTexts || {}) },
  };

  // Merge session exercises into library
  nextState.sessionLogs.forEach(session => {
    mergeExercisesIntoLibrary(nextState.exercisesLibrary, session.exercises || []);
  });

  return nextState;
}

export function createDefaultState() {
  return buildState({
    dailyLogs: [],
    sessionLogs: [],
    exercisesLibrary: cloneDefaultExercisesLibrary(),
    rulesSettings: cloneDefaultRules(),
    plan4Weeks: cloneDefaultPlan4Weeks(),
    infoTexts: cloneDefaultInfoTexts(),
  });
}

// ── Load / save ────────────────────────────────────────────────

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return buildState(JSON.parse(raw));
  } catch (e) {
    console.error("Failed to load state:", e);
    return createDefaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
