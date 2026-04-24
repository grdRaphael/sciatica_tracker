// ============================================================
// IO — import / export JSON + CSV (verbatim column order from v1)
// ============================================================

import { buildState } from "./storage.js";
import {
  sortLogsByDate, computeWalkTotal, computeSymptomIndex, computeTrafficLight, toNumber,
} from "./metrics.js";

// ── Export JSON ───────────────────────────────────────────────

export function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  downloadBlob(blob, `sciatica-tracker-export-${todayISO()}.json`);
}

// ── Import JSON ───────────────────────────────────────────────

export function importJson(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const newState = buildState(JSON.parse(e.target.result));
      onSuccess(newState);
    } catch (err) {
      console.error(err);
      onError("Import JSON invalide.");
    }
  };
  reader.readAsText(file);
}

// ── Export CSV (daily logs — same columns as v1) ───────────────

export function exportDailyCsv(state) {
  const logs = sortLogsByDate(state.dailyLogs);
  if (!logs.length) {
    alert("Aucun daily log à exporter.");
    return;
  }

  const headers = [
    "date","sleep","dayQuality","pain","paresthesiaGlute","paresthesiaFoot","sacrumTension",
    "symptomsMorning","symptomsAfterSitting","sittingMaxMin","carMaxMin",
    "walk1Min","walk2Min","walkTotalMin","sessionDurationMin","sessionRpe",
    "reactionImmediate","reaction24h","symptomIndex","trafficLight","notes",
  ];

  const rows = logs.map((log, idx) => {
    const prev = idx > 0 ? logs[idx - 1] : null;
    const traffic = computeTrafficLight(log, prev, state.rulesSettings);
    return [
      log.date, log.sleep, log.dayQuality, log.pain,
      log.paresthesiaGlute, log.paresthesiaFoot, log.sacrumTension,
      log.symptomsMorning, log.symptomsAfterSitting,
      log.sittingMaxMin, log.carMaxMin,
      log.walk1Min, log.walk2Min, computeWalkTotal(log),
      log.sessionDurationMin, log.sessionRpe,
      log.reactionImmediate, log.reaction24h,
      computeSymptomIndex(log), traffic,
      (log.notes || "").replace(/\n/g, " "),
    ];
  });

  const csv = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `sciatica-tracker-daily-${todayISO()}.csv`);
}

// ── Helpers ───────────────────────────────────────────────────

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
