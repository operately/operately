import * as Pages from "@/components/Pages";
import Api from "@/api";
import * as Projects from "@/models/projects";
import { folders, resource_hubs, ResourceHubNode, ResourceHubFolder } from "@/models/resourceHubs";
import * as Tasks from "@/models/tasks";

interface LoaderResult {
  folder: ResourceHubFolder;
  nodes: ResourceHubNode[];
  draftNodes: ResourceHubNode[];
  projectContext: ProjectContext | null;
}

export async function loader({ params }): Promise<LoaderResult> {
  const [folder, nodes] = await Promise.all([
    folders
      .get({
        id: params.id,
        includeResourceHub: true,
        includePathToFolder: true,
        includePermissions: true,
        includePotentialSubscribers: true,
      })
      .then((res) => res.folder!),
    resource_hubs.listNodes({
      folderId: params.id,
      includeChildrenCount: true,
      includeCommentsCount: true,
    }),
  ]);

  const projectId = folder.resourceHub?.project?.id;
  const resourceHubId = folder.resourceHub?.id;

  return {
    folder,
    nodes: nodes.nodes!,
    draftNodes: nodes.draftNodes!,
    projectContext: projectId && resourceHubId ? await loadProjectContext(projectId, resourceHubId) : null,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}

interface ProjectContext {
  project: Projects.Project;
  tasks: Tasks.Task[];
  childrenCount: Projects.ProjectChildrenCount;
  docsAndFilesCount: number;
}

async function loadProjectContext(projectId: string, resourceHubId: string): Promise<ProjectContext> {
  const [project, tasks, childrenCount, resourceHubNodes] = await Promise.all([
    Projects.getProject({
      id: projectId,
      includeSpace: true,
      includePermissions: true,
      includeRetrospective: true,
    }).then((d) => d.project!),
    Api.tasks.list({ projectId }).then((d) => d.tasks!),
    Api.projects.countChildren({ id: projectId }).then((d) => d.childrenCount),
    resource_hubs.listNodes({
      resourceHubId,
      includeChildrenCount: true,
      includeCommentsCount: true,
    }),
  ]);

  return { project, tasks, childrenCount, docsAndFilesCount: resourceHubNodes.nodes?.length || 0 };
}
