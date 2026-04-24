// ============================================================
// useTrackerData — single source of truth, auto-persists
// ============================================================

import { useState, useCallback, useRef } from "react";
import { loadState, saveState, buildState, normalizeSessionExercise, mergeExercisesIntoLibrary } from "../lib/storage.js";
import { sortLogsByDate, normalizeExerciseName } from "../lib/metrics.js";
import { exportJson, importJson, exportDailyCsv } from "../lib/io.js";

export function useTrackerData() {
  const [state, setStateRaw] = useState(() => loadState());
  const stateRef = useRef(state);

  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      stateRef.current = next;
      saveState(next);
      return next;
    });
  }, []);

  // ── Daily logs ─────────────────────────────────────────────

  const upsertDailyLog = useCallback((log) => {
    setState(prev => {
      const logs = [...prev.dailyLogs];
      const idx = logs.findIndex(l => l.date === log.date);
      if (idx >= 0) logs[idx] = log;
      else logs.push(log);
      return { ...prev, dailyLogs: sortLogsByDate(logs) };
    });
  }, [setState]);

  const getDailyByDate = useCallback((dateStr) =>
    state.dailyLogs.find(l => l.date === dateStr) || null,
  [state.dailyLogs]);

  const getPreviousDailyBefore = useCallback((dateStr) => {
    const sorted = sortLogsByDate(state.dailyLogs);
    const prev = sorted.filter(l => l.date < dateStr);
    return prev[prev.length - 1] || null;
  }, [state.dailyLogs]);

  // ── Session logs ───────────────────────────────────────────

  const upsertSessionLog = useCallback((session) => {
    setState(prev => {
      const logs = [...prev.sessionLogs];
      const idx = logs.findIndex(s => s.date === session.date);
      if (idx >= 0) logs[idx] = session;
      else logs.push(session);

      // Also sync exercises into library
      const newLibrary = [...prev.exercisesLibrary];
      mergeExercisesIntoLibrary(newLibrary, session.exercises || []);

      return { ...prev, sessionLogs: sortLogsByDate(logs), exercisesLibrary: newLibrary };
    });
  }, [setState]);

  const getSessionByDate = useCallback((dateStr) =>
    state.sessionLogs.find(s => s.date === dateStr) || null,
  [state.sessionLogs]);

  const getPreviousSessionBefore = useCallback((dateStr) => {
    const sorted = sortLogsByDate(state.sessionLogs).filter(
      s => Array.isArray(s.exercises) && s.exercises.length
    );
    const prev = sorted.filter(s => s.date < dateStr);
    return prev[prev.length - 1] || null;
  }, [state.sessionLogs]);

  // ── Exercise library ───────────────────────────────────────

  const addExerciseToLibrary = useCallback((name, options = {}) => {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return { ok: false, reason: "empty" };

    const normalizedTarget = normalizeExerciseName(trimmed);
    const existing = state.exercisesLibrary.find(
      ex => normalizeExerciseName(ex.name) === normalizedTarget
    );
    if (existing) return { ok: false, reason: "duplicate", name: existing.name };

    setState(prev => ({
      ...prev,
      exercisesLibrary: [
        ...prev.exercisesLibrary,
        { name: trimmed, category: options.category || "", defaultLevel: options.defaultLevel || "standard" },
      ],
    }));
    return { ok: true, name: trimmed };
  }, [state.exercisesLibrary, setState]);

  // ── Plan ───────────────────────────────────────────────────

  const savePlan = useCallback((plan4Weeks) => {
    setState(prev => ({ ...prev, plan4Weeks }));
  }, [setState]);

  // ── Rules ──────────────────────────────────────────────────

  const saveRules = useCallback((rulesSettings) => {
    setState(prev => ({ ...prev, rulesSettings }));
  }, [setState]);

  // ── Info texts ─────────────────────────────────────────────

  const saveInfoTexts = useCallback((infoTexts) => {
    setState(prev => ({ ...prev, infoTexts }));
  }, [setState]);

  // ── Import / Export ────────────────────────────────────────

  const handleExportJson = useCallback(() => exportJson(state), [state]);

  const handleImportJson = useCallback((file) => {
    importJson(
      file,
      (newState) => setState(newState),
      (msg) => alert(msg)
    );
  }, [setState]);

  const handleExportCsv = useCallback(() => exportDailyCsv(state), [state]);

  // ── Reset ──────────────────────────────────────────────────

  const resetAllData = useCallback(() => {
    const ok = confirm("Reset complet des données ? Cette action est irréversible.");
    if (!ok) return;
    setState(buildState({}));
  }, [setState]);

  return {
    state,
    upsertDailyLog,
    getDailyByDate,
    getPreviousDailyBefore,
    upsertSessionLog,
    getSessionByDate,
    getPreviousSessionBefore,
    addExerciseToLibrary,
    savePlan,
    saveRules,
    saveInfoTexts,
    handleExportJson,
    handleImportJson,
    handleExportCsv,
    resetAllData,
  };
}
