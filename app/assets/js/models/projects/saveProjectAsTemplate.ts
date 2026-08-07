import type { Json, ProjectTemplateScheduleIssue, ProjectTemplatesCreateFromProjectResult } from "@/api";
import type { Paths } from "@/routes/paths";
import type { SaveProjectAsTemplateModal } from "turboui";

interface Dependencies {
  projectId: string;
  paths: Pick<Paths, "projectPath" | "projectMilestonePath" | "taskPath" | "projectTemplatePath">;
  createFromProject: (input: {
    projectId: string;
    name: string;
    description?: Json | null;
  }) => Promise<ProjectTemplatesCreateFromProjectResult>;
  navigate: (path: string) => void;
}

export function createSaveProjectAsTemplateHandler(dependencies: Dependencies) {
  return async (values: SaveProjectAsTemplateModal.Values): Promise<SaveProjectAsTemplateModal.Result> => {
    try {
      const response = await dependencies.createFromProject({
        projectId: dependencies.projectId,
        name: values.name.trim(),
        description: values.description as Json,
      });

      if (response.scheduleIssues.length > 0) {
        return {
          success: false,
          scheduleIssues: response.scheduleIssues.map((issue) => mapScheduleIssue(issue, dependencies.paths)),
        };
      }

      if (!response.template) {
        return { success: false, error: "The template could not be created. Check the project and try again." };
      }

      dependencies.navigate(dependencies.paths.projectTemplatePath(response.template.id));
      return { success: true };
    } catch (_error) {
      return { success: false, error: "The template could not be created. Check the project and try again." };
    }
  };
}

export function mapScheduleIssue(
  issue: ProjectTemplateScheduleIssue,
  paths: Pick<Paths, "projectPath" | "projectMilestonePath" | "taskPath">,
): SaveProjectAsTemplateModal.ScheduleIssue {
  return {
    resourceType: issue.resourceType,
    resourceId: issue.resourceId,
    resourceName: issue.resourceName,
    field: issue.field,
    date: issue.date ?? null,
    reason: issue.reason,
    link: scheduleIssuePath(issue, paths),
  };
}

function scheduleIssuePath(
  issue: ProjectTemplateScheduleIssue,
  paths: Pick<Paths, "projectPath" | "projectMilestonePath" | "taskPath">,
) {
  switch (issue.resourceType) {
    case "project":
      return paths.projectPath(issue.resourceId);
    case "milestone":
      return paths.projectMilestonePath(issue.resourceId);
    case "task":
      return paths.taskPath(issue.resourceId);
  }
}
