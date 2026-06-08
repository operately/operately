import React from "react";

import Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { ResourceHubDocsAndFiles } from "@/features/ResourceHub/DocsAndFiles";
import * as Tasks from "@/models/tasks";
import * as Time from "@/utils/time";

import { parseSpaceForTurboUI } from "@/models/spaces";
import { Paths, usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

import {
  IconClipboardText,
  IconEdit,
  IconFileText,
  IconListCheck,
  IconLogs,
  IconMessage,
  IconMessages,
  ProjectPageLayout,
  showErrorToast,
  useTabs,
} from "turboui";
import { Project, ProjectChildrenCount, ResourceHubFolder, ResourceHubNode, Task } from "../../api";
import { RenameFolderModal } from "../../features/ResourceHub/components/FolderMenu";
import { useAiSidebar } from "../../features/AiSidebar";
import { useBoolState } from "../../hooks/useBoolState";

export function Page() {
  const { folder, nodes, projectContext } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");

  if (projectContext) {
    return (
      <ProjectFolderPage
        folder={folder}
        project={projectContext.project}
        tasks={projectContext.tasks}
        childrenCount={projectContext.childrenCount}
        docsAndFilesCount={projectContext.docsAndFilesCount}
        nodes={nodes}
        refresh={refresh}
      />
    );
  }

  return (
    <Pages.Page title={folder.name!}>
      <Paper.Root size="large">
        <Paper.Body minHeight="75vh">
          <Options folder={folder} />
          <ResourceHubDocsAndFiles
            folder={folder}
            resourceHub={folder.resourceHub}
            nodes={nodes}
            refresh={refresh}
            className="p-0"
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ProjectFolderPage({
  folder,
  project,
  tasks,
  childrenCount,
  docsAndFilesCount,
  nodes,
  refresh,
}: {
  folder: ResourceHubFolder;
  project: Project;
  tasks: Task[];
  childrenCount: ProjectChildrenCount;
  docsAndFilesCount: number;
  nodes: ResourceHubNode[];
  refresh: () => void | Promise<void>;
}) {
  const paths = usePaths();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(project.id, "project.id must be present in folder project context");
  assertPresent(project.name, "project.name must be present in folder project context");

  useAiSidebar({
    conversationContext: {
      id: project.id,
      type: "project",
      title: project.name,
      url: paths.projectPath(project.id),
    },
  });

  const [projectName, setProjectName] = React.useState(project.name);

  React.useEffect(() => {
    setProjectName(project.name);
  }, [project.name]);

  const updateProjectName = React.useCallback(
    async (name: string) => {
      if (name.trim() === "") {
        showErrorToast("Project name cannot be empty", "Reverted the project name to its previous value.");
        return false;
      }

      setProjectName(name);

      return Api.projects
        .updateName({ projectId: project.id, name })
        .then(() => true)
        .catch((error) => {
          console.error("Failed to update project name", error);
          setProjectName(project.name);
          showErrorToast("Network Error", "Reverted the project name to its previous value.");
          return false;
        });
    },
    [project.id, project.name],
  );

  const tabs = useTabs(
    "docs-and-files",
    [
      { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
      {
        id: "tasks",
        label: "Tasks",
        icon: <IconListCheck size={14} />,
        count: childrenCount.tasksCount,
      },
      { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} />, count: childrenCount.checkInsCount },
      {
        id: "discussions",
        label: "Discussions",
        icon: <IconMessages size={14} />,
        count: childrenCount.discussionsCount,
      },
      {
        id: "docs-and-files",
        label: "Docs & Files",
        icon: <IconFileText size={14} />,
        count: docsAndFilesCount,
      },
      { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    ],
    { urlPath: paths.projectPath(project.id) },
  );

  const spaceProps = project.space
    ? {
        workmapLink: paths.spaceWorkMapPath(project.space.id, "projects" as const),
        space: parseSpaceForTurboUI(paths, project.space),
      }
    : { homeLink: paths.homePath() };

  return (
    <ProjectPageLayout
      title={[projectName]}
      projectName={projectName}
      taskCompletion={taskCompletionStats(paths, tasks)}
      status={project.status}
      state={project.state}
      closedAt={Time.parse(project.closedAt)}
      reopenLink={paths.resumeProjectPath(project.id)}
      retrospectiveLink={paths.projectRetrospectivePath(project.id)}
      updateProjectName={updateProjectName}
      permissions={project.permissions || {}}
      tabs={tabs}
      testId="project-folder-page"
      {...spaceProps}
    >
      <div className="flex-1 overflow-auto">
        <ResourceHubDocsAndFiles folder={folder} resourceHub={folder.resourceHub} nodes={nodes} refresh={refresh} />
      </div>
    </ProjectPageLayout>
  );
}

function taskCompletionStats(paths: Paths, tasks: Task[]): ProjectPageLayout.TaskCompletionStats | null {
  const parsedTasks = Tasks.parseTasksForTurboUi(paths, tasks, { type: "project" });
  const totalCount = parsedTasks.length;

  if (totalCount === 0) return null;

  const completedCount = parsedTasks.filter((task) => {
    const status = task.status;

    if (!status) return false;

    return (
      status.value === "done" || status.value === "completed" || Boolean(status.closed && status.color === "green")
    );
  }).length;

  return {
    completedCount,
    totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
  };
}

function Options({ folder }: { folder: ResourceHubFolder }) {
  assertPresent(folder.permissions, "permissions must be present in folder");

  const [showRenameForm, toggleRenameForm] = useBoolState(false);
  const refresh = useRefresh();

  if (!folder.permissions.canRenameFolder) {
    return null;
  }

  return (
    <>
      <PageOptions.Root testId="options-button">
        <PageOptions.Action icon={IconEdit} title="Rename" onClick={toggleRenameForm} testId="rename-folder" />
      </PageOptions.Root>

      <RenameFolderModal
        folder={folder}
        showForm={showRenameForm}
        toggleForm={toggleRenameForm}
        // Key is needed because when the folder's name changes, if the component
        // is not rerendered, the old name will appear in the form
        key={folder.name}
        onSave={refresh}
      />
    </>
  );
}
