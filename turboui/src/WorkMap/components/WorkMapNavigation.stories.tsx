import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { IconChecklist, IconCircleCheck, IconLayoutGrid, IconPlayerPause, IconTarget } from "../../icons";
import { useTabs } from "../../Tabs";
import { WorkMapNavigation } from "./WorkMapNavigation";

export default {
  title: "Components/WorkMapNavigation",
  component: WorkMapNavigation,
  parameters: { reactRouter: { path: "/?tab=projects&ref=storybook" } },
};

export const NarrowLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const tabsState = useTabs("all", [
    { id: "all", label: t("All work"), icon: <IconLayoutGrid size={16} />, count: 6 },
    { id: "goals", label: t("Goals"), icon: <IconTarget size={16} />, count: 2 },
    { id: "projects", label: t("Projects"), icon: <IconChecklist size={16} />, count: 4 },
    { id: "paused", label: t("Paused"), icon: <IconPlayerPause size={16} /> },
    { id: "completed", label: t("Completed"), icon: <IconCircleCheck size={16} /> },
  ]);
  const view = new URLSearchParams(location.search).get("view") === "timeline" ? "timeline" : "table";

  return (
    <div className="bg-surface-base dark:bg-surface-dark mx-auto max-w-5xl rounded-lg">
      <WorkMapNavigation tabsState={tabsState} timelineAvailable view={view} />
    </div>
  );
};
