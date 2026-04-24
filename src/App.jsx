import { useState, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { AppShell } from "./components/shell/AppShell.jsx";
import { DashboardView } from "./views/DashboardView.jsx";
import { DailyEntryView } from "./views/DailyEntryView.jsx";
import { SessionLogView } from "./views/SessionLogView.jsx";
import { PlanView } from "./views/PlanView.jsx";
import { RulesView } from "./views/RulesView.jsx";
import { useTrackerData } from "./hooks/useTrackerData.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const {
    state,
    upsertDailyLog,
    getDailyByDate,
    getPreviousDailyBefore,
    upsertSessionLog,
    getSessionByDate,
    getPreviousSessionBefore,
    savePlan,
    saveRules,
    saveInfoTexts,
    handleExportJson,
    handleImportJson,
    handleExportCsv,
    resetAllData,
  } = useTrackerData();

  // PWA auto-update
  useRegisterSW({ immediate: true });

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onExportJson={handleExportJson}
      onImportJson={handleImportJson}
      onExportCsv={handleExportCsv}
      onReset={resetAllData}
    >
      {activeTab === "dashboard" && (
        <DashboardView state={state} onTabChange={handleTabChange} />
      )}
      {activeTab === "daily" && (
        <DailyEntryView
          state={state}
          upsertDailyLog={upsertDailyLog}
          getDailyByDate={getDailyByDate}
          getPreviousDailyBefore={getPreviousDailyBefore}
        />
      )}
      {activeTab === "session" && (
        <SessionLogView
          state={state}
          upsertSessionLog={upsertSessionLog}
          getSessionByDate={getSessionByDate}
          getPreviousSessionBefore={getPreviousSessionBefore}
        />
      )}
      {activeTab === "plan" && (
        <PlanView state={state} savePlan={savePlan} />
      )}
      {activeTab === "rules" && (
        <RulesView
          state={state}
          saveRules={saveRules}
          saveInfoTexts={saveInfoTexts}
        />
      )}
    </AppShell>
  );
}
