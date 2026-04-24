// ============================================================
// DEFAULTS — verbatim from script.js v1
// Do NOT change values; they determine medical tracking thresholds.
// ============================================================

export const STORAGE_KEY = "sciaticaRecoveryTracker_v1";

export const VALID_EXERCISE_LEVELS = new Set(["regression", "standard", "progression"]);

export const DEFAULT_EXERCISES_LIBRARY = [
  { name: "Cat-camel", category: "Mobility", defaultLevel: "regression" },
  { name: "Bridge light", category: "Strength", defaultLevel: "regression" },
  { name: "Hinge small ROM", category: "Patterning", defaultLevel: "regression" },
  { name: "Clamshell", category: "Glute", defaultLevel: "regression" },
  { name: "Dead bug", category: "Core", defaultLevel: "regression" },
  { name: "Dead bug (standard)", category: "Core", defaultLevel: "standard" },
  { name: "Bird dog", category: "Core", defaultLevel: "regression" },
  { name: "Bird dog (standard)", category: "Core", defaultLevel: "standard" },
  { name: "Incline plank", category: "Core", defaultLevel: "regression" },
  { name: "Walking", category: "Exposure", defaultLevel: "standard" },
  { name: "Sitting exposure", category: "Exposure", defaultLevel: "standard" },
  { name: "Car exposure", category: "Exposure", defaultLevel: "standard" },
  { name: "Leg press light", category: "Machine", defaultLevel: "regression" },
  { name: "Chest-supported row", category: "Machine", defaultLevel: "regression" },
  { name: "Chest press light", category: "Machine", defaultLevel: "regression" },
  { name: "Lat pulldown light", category: "Machine", defaultLevel: "regression" },
];

export const DEFAULT_RULES = {
  // practical heuristic / scientific uncertainty:
  // Ces seuils sont des conventions de suivi (auto-monitoring), pas des seuils médicaux universels.
  painRed: 7,
  painOrange: 4,
  paresthesiaRed: 7,        // composite (moyenne fessier+pied)
  paresthesiaOrange: 4,
  sittingRedMax: 15,         // si max toléré <= 15 min => red posture flag
  sittingOrangeMax: 30,
  carRedMax: 10,
  carOrangeMax: 20,
  stableDaysForProgression: 7,
  flarePainDelta: 2,         // flare >24h si +2 douleur vs veille
  badDayReductionMinPct: 30,
  badDayReductionMaxPct: 50,
  highSymptomIndexAlert: 5.5,
  fastProgressionPct: 20,    // volume week-over-week > +20% => alerte "trop rapide"
};

export const DEFAULT_INFO_TEXTS = {
  nonUrgent:
`Reconsulter (non urgent) si :
- symptômes stagnent ou aggravent sur plusieurs semaines malgré adaptation de charge
- tolérance assise / voiture régresse de façon durable
- douleurs nocturnes fréquentes qui perturbent le sommeil
- besoin d'ajuster la stratégie de reprise (volume, choix d'exercices, progressions)

Cette app ne remplace pas un avis médical.`,
  redFlags:
`Urgence (red flags) :
- faiblesse marquée d'une jambe qui apparaît ou s'aggrave
- perte de contrôle urinaire / fécal
- anesthésie en selle (zone périnéale)
- douleur insupportable + symptômes neurologiques rapidement progressifs
- traumatisme important + douleur sévère

Si présent => consulter en urgence.`,
};

export const DEFAULT_PLAN_4WEEKS = [
  {
    week: 1,
    title: "S1 - Stabilisation",
    objectives: "Stabiliser symptômes, routine quotidienne simple, éviter flare-up",
    priorityExercises: "Cat-camel, Bridge light, Clamshell, Walking, Sitting exposure",
    sittingTargetMin: 25,
    carTargetMin: 15,
    progressionRule: "Une seule variable à la fois (ex: +1 série OU +5 min assise)",
    badDayVersion: "Réduire volume 30–50%, garder mobilité + marche",
    endValidation: "Repeat",
  },
  {
    week: 2,
    title: "S2 - Légère progression volume",
    objectives: "Augmenter légèrement volume sans aggravation >24h",
    priorityExercises: "Bridge light, Hinge small ROM, Dead bug regressed, Walking, Sitting exposure, Car exposure",
    sittingTargetMin: 30,
    carTargetMin: 20,
    progressionRule: "Augmenter reps OU sets (pas les deux)",
    badDayVersion: "Volume réduit, maintenir exposition dosée",
    endValidation: "Repeat",
  },
  {
    week: 3,
    title: "S3 - Consolidation + anti-extension léger",
    objectives: "Consolider tolérance, introduire anti-extension léger",
    priorityExercises: "Dead bug, Bird dog, Incline plank, Hinge small ROM, Walking",
    sittingTargetMin: 35,
    carTargetMin: 25,
    progressionRule: "Si semaine stable, micro-progression d'une variable",
    badDayVersion: "Retour version régressée des exos + marche",
    endValidation: "Repeat",
  },
  {
    week: 4,
    title: "S4 - Préparation reprise salle",
    objectives: "Tester machines légères si semaine stable",
    priorityExercises: "Leg press light, Chest-supported row, Chest press light, Lat pulldown light + core léger",
    sittingTargetMin: 40,
    carTargetMin: 30,
    progressionRule: "Reprise salle uniquement si semaine stable (GREEN/ORANGE léger, pas RED)",
    badDayVersion: "Supprimer machines, garder mobilité/core léger + marche",
    endValidation: "Repeat",
  },
];

// ── Session exercise level system ──────────────────────────────
export const SESSION_LEVEL_RANK = { regression: 1, standard: 2, progression: 3 };
export const SESSION_LEVEL_LABEL = { 1: "regression", 2: "standard", 3: "progression" };
export const SESSION_PROGRESSION_DELTA_THRESHOLD = 0.1;
export const SESSION_REGRESSION_DELTA_THRESHOLD = -0.1;
export const SESSION_HOLD_REP_WEIGHT = 0.25;
export const SESSION_LOAD_FACTOR_PER_KG = 1 / 20;

export const SESSION_PROGRESS_METRICS = {
  level: { key: "levelScore", label: "Niveau", color: "#2563eb", fill: "rgba(37, 99, 235, 0.14)" },
  sets: { key: "sets", label: "Sets", color: "#0f766e", fill: "rgba(15, 118, 110, 0.14)" },
  reps: { key: "reps", label: "Reps", color: "#7c3aed", fill: "rgba(124, 58, 237, 0.14)" },
  holdSec: { key: "holdSec", label: "Hold", color: "#c2410c", fill: "rgba(194, 65, 12, 0.14)" },
};
