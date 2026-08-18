import React from "react";

import { ProjectTasksSection } from "./ProjectTasksSection";
import { TemplateTasksSection } from "./TemplateTasksSection";
import { useTaskSlideIn } from "./useTaskSlideIn";
import type { MilestonePage } from "../types";
import { isTemplateMilestoneState } from "../types";

export function TasksSection(props: MilestonePage.State) {
  const { selectedTaskId, setSelectedTaskId, taskSlideIn } = useTaskSlideIn(props);

  if (isTemplateMilestoneState(props)) {
    return <TemplateTasksSection {...props} taskSlideIn={taskSlideIn} onTaskOpen={setSelectedTaskId} />;
  }

  return (
    <ProjectTasksSection
      {...props}
      taskSlideIn={taskSlideIn}
      selectedTaskId={selectedTaskId}
      onTaskOpen={setSelectedTaskId}
    />
  );
}
