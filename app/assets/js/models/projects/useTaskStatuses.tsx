import * as React from "react";
import Api from "@/api";
import type { ProjectTaskStatus } from "@/api";
import { showErrorToast } from "turboui";
import type { ProjectPage } from "turboui";

type TaskStatus = ProjectPage.TaskStatus;

export function useTaskStatuses(
  projectId: string,
  backendStatuses: ProjectTaskStatus[] | null | undefined,
  refresh?: () => void,
) {
  const statuses = React.useMemo(() => mapBackendStatusesToUi(backendStatuses), [backendStatuses]);

  const handleSaveStatuses = React.useCallback(
    async (nextStatuses: TaskStatus[]) => {
      const taskStatuses: ProjectTaskStatus[] = nextStatuses.map((status, index) => ({
        id: status.id,
        label: status.label,
        color: mapUiColorToBackend(status.color),
        index,
        value: status.value ?? status.id,
        hidden: false,
      }));

      try {
        const res = await Api.projects.updateTaskStatuses({
          projectId,
          taskStatuses,
        });

        if (res.success === false) {
          showErrorToast("Error", "Failed to update task statuses");
          return;
        }

        refresh?.();
      } catch (error) {
        console.error("Failed to update task statuses", error);
        showErrorToast("Error", "Failed to update task statuses");
      }
    },
    [projectId, refresh],
  );

  return {
    statuses,
    handleSaveStatuses,
  };
}

function mapBackendColorToUi(color: string | null | undefined): Pick<TaskStatus, "color" | "icon"> {
  switch (color) {
    case "blue":
      return { color: "brand", icon: "circleDot" };
    case "green":
      return { color: "success", icon: "circleCheck" };
    case "red":
      return { color: "danger", icon: "circleX" };
    case "gray":
    default:
      return { color: "dimmed", icon: "circleDashed" };
  }
}

function mapUiColorToBackend(color: TaskStatus["color"]): string {
  switch (color) {
    case "brand":
      return "blue";
    case "success":
      return "green";
    case "danger":
      return "red";
    case "dimmed":
    default:
      return "gray";
  }
}

function mapBackendStatusesToUi(backend: ProjectTaskStatus[] | null | undefined): TaskStatus[] {
  if (!backend || backend.length === 0) return [];

  return backend
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((status) => {
      const { color, icon } = mapBackendColorToUi(status.color);

      return {
        id: status.id,
        label: status.label,
        value: status.value,
        index: status.index,
        color,
        icon,
      };
    });
}
