import Api from "@/api";
import { useQuery } from "@tanstack/react-query";

export { content, serializeContent, serializeJson } from "./operations";
export {
  useArchiveProjectTemplate,
  useCreateProjectTemplate,
  useCreateProjectTemplateFromProject,
  useDeleteProjectTemplate,
  useDuplicateProjectTemplate,
  useRestoreProjectTemplate,
} from "./projectTemplateLifecycle";

export function useActiveProjectTemplates({ enabled }: { enabled: boolean }) {
  return useQuery({
    ...Api.project_templates.listQueryOptions({ archiveStatus: "active" }),
    select: (result) => result.templates,
    enabled,
  });
}
