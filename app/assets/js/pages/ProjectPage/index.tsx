import Api from "@/api";
import { PageModule } from "@/routes/types";
import * as React from "react";
import { useNavigate } from "react-router-dom";

import * as Goals from "@/models/goals";
import * as People from "@/models/people";
import * as Projects from "@/models/projects";
import * as Tasks from "@/models/tasks";
import * as Time from "@/utils/time";

import { Feed, useItemsQuery } from "@/features/Feed";
import { PageCache } from "@/routes/PageCache";
import { ProjectPage, showErrorToast } from "turboui";
import { assertPresent } from "../../utils/assertions";
import { fetchAll } from "../../utils/async";

import { parseMilestoneForTurboUi, parseMilestonesForTurboUi } from "@/models/milestones";
import { parseCheckInsForTurboUi, ProjectCheckIn } from "@/models/projectCheckIns";
import { parseSpaceForTurboUI } from "@/models/spaces";
import { Paths, usePaths } from "@/routes/paths";
import { useAiSidebar } from "../../features/AiSidebar";
import { parseContextualDate, serializeContextualDate } from "../../models/contextualDates";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useSubscription } from "@/models/subscriptions";

export default { name: "ProjectPage", loader, Page } as PageModule;
export { pageCacheKey as projectPageCacheKey };

function pageCacheKey(id: string): string {
  return `v6-ProjectV2Page.project-${id}`;
}

type LoaderResult = {
  data: {
    project: Projects.Project;
    checkIns: ProjectCheckIn[];
    discussions: Projects.Discussion[];
    backendTasks: Tasks.Task[];
    childrenCount: Projects.ProjectChildrenCount;
  };
  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      fetchAll({
        project: Projects.getProject({
          id: params.id,
          includeSpace: true,
          includeGoal: true,
          includeChampion: true,
          includeReviewer: true,
          includePermissions: true,
          includeContributors: true,
          includeKeyResources: true,
          includeMilestones: true,
          includeLastCheckIn: true,
          includePrivacy: true,
          includeRetrospective: true,
          includeUnreadNotifications: true,
          includeSubscriptionList: true,
        }).then((d) => d.project!),
        checkIns: Api.getProjectCheckIns({ projectId: params.id, includeAuthor: true }).then((d) => d.projectCheckIns!),
        discussions: Api.project_discussions.list({ projectId: params.id }).then((d) => d.discussions!),
        backendTasks: Api.tasks.list({ projectId: params.id }).then((d) => d.tasks!),
        childrenCount: Api.projects.countChildren({ id: params.id }).then((d) => d.childrenCount),
      }),
  });
}

function Page() {
  const paths = usePaths();
  const { data, refresh } = PageCache.useData(loader);
  const { project, checkIns, discussions, backendTasks, childrenCount } = data;
  const navigate = useNavigate();
  const currentUser = useMe();

  useAiSidebar({
    conversationContext: {
      id: project.id!,
      type: "project",
      title: project.name,
      url: paths.projectPath(project.id!),
    },
  });

  assertPresent(project.state);
  assertPresent(project.permissions?.canEditName);
  assertPresent(project.contributors);

  const transformPerson = React.useCallback((p) => People.parsePersonForTurboUi(paths, p)!, [paths]);
  const { spaceProps, champion, reviewer } = useSpaceProps({ project, paths, transformPerson });
  const backLink = "workmapLink" in spaceProps ? spaceProps.workmapLink : spaceProps.homeLink;

  const [projectName, setProjectName] = usePageField({
    value: (data) => data.project.name!,
    update: (v) => Api.editProjectName({ projectId: project.id, name: v }).then(() => true),
    onError: (e: string) => showErrorToast(e, "Reverted the project name to its previous value."),
    validations: [(v) => (v.trim() === "" ? "Project name cannot be empty" : null)],
  });

  const [description, setDescription] = usePageField({
    value: (data: { project: Projects.Project }) => data.project.description && JSON.parse(data.project.description),
    update: (v) =>
      Api.updateProjectDescription({ projectId: project.id!, description: JSON.stringify(v) }).then(() => true),
    onError: () => showErrorToast("Network Error", "Reverted the description to its previous value."),
  });

  const [parentGoal, setParentGoal] = usePageField({
    value: (data: { project: Projects.Project }) => Goals.parseParentGoalForTurboUi(paths, data.project.goal),
    update: (v) =>
      Api.projects.updateParentGoal({
        projectId: project.id,
        goalId: v && v.id,
        goalName: v && v.name,
      }),
    onError: () => showErrorToast("Network Error", "Reverted the parent goal to its previous value."),
  });

  const [dueDate, setDueDate] = usePageField({
    value: (data: { project: Projects.Project }) => parseContextualDate(data.project.timeframe?.contextualEndDate),
    update: (v) => Api.projects.updateDueDate({ projectId: project.id, dueDate: serializeContextualDate(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the due date to its previous value."),
  });

  const [startedDate, setStartedDate] = usePageField({
    value: (data: { project: Projects.Project }) => parseContextualDate(data.project.timeframe?.contextualStartDate),
    update: (v) => Api.projects.updateStartDate({ projectId: project.id, startDate: serializeContextualDate(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the started date to its previous value."),
  });

  const {
    milestones,
    filteredMilestones,
    setMilestones,
    createMilestone,
    updateMilestone,
    reorderMilestones,
    searchMilestones,
  } = useMilestones(paths, project, refresh);
  const { resources, createResource, updateResource, removeResource } = useResources(project);

  const {
    tasks: baseTasks,
    setTasks,
    createTask,
    updateTaskName,
    updateTaskDueDate,
    updateTaskAssignee,
    updateTaskStatus,
    updateTaskDescription,
    updateTaskMilestone,
    deleteTask,
  } = Tasks.useProjectTasksForTurboUi({
    backendTasks,
    projectId: project.id,
    cacheKey: pageCacheKey(project.id),
    milestones,
    setMilestones,
    refresh,
  });

  const subscriptions = useSubscription({
    subscriptionList: project.subscriptionList,
    entityId: project.id,
    entityType: "project",
    cacheKey: pageCacheKey(project.id),
    onRefresh: refresh,
  });

  const parentGoalSearch = useParentGoalSearch(project);
  const richEditorHandlers = useRichEditorHandlers({ scope: { type: "project", id: project.id } });


  const assigneePersonSearch = Tasks.useTaskAssigneeSearch({
    id: project.id,
    type: "project",
    transformResult: transformPerson,
  });

  const { statuses, handleSaveStatuses } = Projects.useTaskStatuses(project.id, project.taskStatuses, refresh);

  const { kanbanState, handleTaskKanbanChange } = Tasks.useKanbanState({
    initialRawState: project.tasksKanbanState,
    statuses,
    projectId: project.id,
    type: "project",
    tasks: baseTasks,
    setTasks,
    onSuccess: async () => {
      PageCache.invalidate(pageCacheKey(project.id));

      if (refresh) {
        await refresh();
      }
    },
  });

  const slideInModel = Tasks.useTaskSlideInProps({
    backendTasks,
    paths,
    currentUser,
    tasks: baseTasks,
    commentEntityType: "project_task",
    canEdit: Boolean(project.permissions?.canEditTask),
    canComment: Boolean(project.permissions?.canCommentOnTask),
    onTaskNameChange: updateTaskName,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onTaskStatusChange: updateTaskStatus,
    onTaskDescriptionChange: updateTaskDescription,
  });

  const deleteProject = async () => {
    return Api.projects
      .delete({ projectId: project.id })
      .then(() => {
        PageCache.invalidate(pageCacheKey(project.id));
        navigate(backLink);

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to delete project", e);
        showErrorToast("Error", "Failed to delete project");

        return { success: false };
      });
  };

  const exportMarkdown = React.useCallback(() => {
    window.open(paths.projectMarkdownExportPath(project.id), "_blank", "noopener");
  }, [paths, project.id]);

  const props: ProjectPage.Props = {
    ...spaceProps,
    champion,
    reviewer,
    closeLink: paths.projectClosePath(project.id),
    reopenLink: paths.resumeProjectPath(project.id),
    pauseLink: paths.pauseProjectPath(project.id),
    exportMarkdown,
    childrenCount,

    project: {
      id: project.id,
      name: projectName,
    },
    updateProjectName: (name: string) => {
      setProjectName(name);
      return Promise.resolve(true);
    },

    description,
    onDescriptionChange: setDescription,

    parentGoal,
    setParentGoal,
    parentGoalSearch,

    startedAt: startedDate,
    setStartedAt: setStartedDate,
    dueAt: dueDate,
    setDueAt: setDueDate,

    status: project.status,
    state: project.state,
    closedAt: Time.parse(project.closedAt),
    retrospectiveLink: paths.projectRetrospectivePath(project.id),

    permissions: project.permissions,
    manageTeamLink: paths.projectContributorsPath(project.id),

    onProjectDelete: deleteProject,

    tasks: baseTasks,
    kanbanState,
    onTaskKanbanChange: handleTaskKanbanChange,
    onTaskCreate: createTask,
    onTaskNameChange: slideInModel.onTaskNameChange,
    onTaskDueDateChange: slideInModel.onTaskDueDateChange,
    onTaskAssigneeChange: slideInModel.onTaskAssigneeChange,
    onTaskStatusChange: slideInModel.onTaskStatusChange,
    onTaskMilestoneChange: updateTaskMilestone,
    onTaskDelete: deleteTask,
    onTaskDescriptionChange: slideInModel.onTaskDescriptionChange,
    getTaskPageProps: slideInModel.getTaskPageProps,
    milestones,
    searchableMilestones: filteredMilestones,
    showMilestoneKanbanLink: false,
    onMilestoneSearch: searchMilestones,
    onMilestoneCreate: createMilestone,
    onMilestoneUpdate: updateMilestone,
    onMilestoneReorder: reorderMilestones,
    contributors: prepareContributors(paths, project.contributors),
    checkIns: parseCheckInsForTurboUi(paths, checkIns),
    discussions: prepareDiscussions(paths, discussions),
    newCheckInLink: paths.projectCheckInNewPath(project.id),
    newDiscussionLink: paths.projectDiscussionNewPath(project.id),
    currentUser: currentUser ? People.parsePersonForTurboUi(paths, currentUser) : null,
    assigneePersonSearch: assigneePersonSearch,

    statuses,
    onSaveCustomStatuses: handleSaveStatuses,

    richTextHandlers: richEditorHandlers,

    resources,
    onResourceAdd: createResource,
    onResourceEdit: updateResource,
    onResourceRemove: removeResource,

    activityFeed: <ProjectFeedItems projectId={project.id} />,

    subscriptions,
  };

  return <ProjectPage key={project.id!} {...props} />;
}

function ProjectFeedItems({ projectId }: { projectId: string }) {
  const { data, loading, error } = useItemsQuery("project", projectId);

  if (loading) return null;
  if (error) return null;

  return <Feed items={data?.activities || []} page="project" testId="project-feed" />;
}

interface usePageFieldProps<T> {
  value: (LoaderResult) => T;
  update: (newValue: T) => Promise<{ success?: boolean | null } | boolean | null | undefined>;
  onError?: (error: any) => void;
  validations?: ((newValue: T) => string | null)[];
}

function usePageField<T>({
  value,
  update,
  onError,
  validations,
}: usePageFieldProps<T>): [T, (v: T) => Promise<boolean>] {
  const { data, cacheVersion } = PageCache.useData(loader, { refreshCache: false });

  const [state, setState] = React.useState<T>(() => value(data));
  const [stateVersion, setStateVersion] = React.useState<number | undefined>(cacheVersion);

  React.useEffect(() => {
    if (cacheVersion !== stateVersion) {
      setState(value(data));
      setStateVersion(cacheVersion);
    }
  }, [value, cacheVersion, stateVersion]);

  const updateState = (newVal: T): Promise<boolean> => {
    return new Promise((resolve) => {
      if (validations) {
        for (const validation of validations) {
          const error = validation(newVal);
          if (error) {
            onError?.(error);
            resolve(false);
            return;
          }
        }
      }

      const oldVal = state;

      const successHandler = () => {
        PageCache.invalidate(pageCacheKey(data.project.id!));
        resolve(true);
      };

      const errorHandler = (error: any) => {
        setState(oldVal);
        onError?.(error);
        resolve(false);
      };

      setState(newVal);

      update(newVal)
        .then((res) => {
          if (res === false || (typeof res === "object" && res?.success === false)) {
            errorHandler("Update failed");
          } else {
            successHandler();
          }
        })
        .catch(errorHandler);
    });
  };

  return [state, updateState];
}

function useSpaceProps({
  project,
  paths,
  transformPerson,
}: {
  project: Projects.Project;
  paths: Paths;
  transformPerson: (p: any) => ProjectPage.Person;
}): {
  spaceProps: ProjectPage.SpaceProps;
  champion: ProjectPage.Person | null;
  reviewer: ProjectPage.Person | null | undefined;
} {
  const [space, setSpace] = usePageField({
    value: (data) => (data.project.space ? parseSpaceForTurboUI(paths, data.project.space) : null),
    update: (v) => Api.moveProjectToSpace({ projectId: project.id, spaceId: v!.id }).then(() => true),
    onError: () => showErrorToast("Network Error", "Reverted the space to its previous value."),
  });

  const [champion, setChampion] = usePageField({
    value: (data) => People.parsePersonForTurboUi(paths, data.project.champion),
    update: (v) => Api.projects.updateChampion({ projectId: project.id, championId: v?.id ?? null }),
    onError: () => showErrorToast("Network Error", "Reverted the champion to its previous value."),
  });

  const [reviewer, setReviewer] = usePageField({
    value: (data) => People.parsePersonForTurboUi(paths, data.project.reviewer),
    update: (v) => Api.projects.updateReviewer({ projectId: project.id, reviewerId: v?.id ?? null }),
    onError: () => showErrorToast("Network Error", "Reverted the reviewer to its previous value."),
  });

  const spaceSearch = useSpaceSearch();

  const ignoredIds = React.useMemo(
    () => [champion?.id, reviewer?.id].filter((id): id is string => Boolean(id)),
    [champion?.id, reviewer?.id],
  );

  const searchScope = space ? { type: "space" as const, id: space.id } : { type: "company" as const };

  const championSearch = People.usePersonFieldSearch({
    scope: searchScope,
    ignoredIds,
    transformResult: transformPerson,
  });

  const reviewerSearch = People.usePersonFieldSearch({
    scope: searchScope,
    ignoredIds,
    transformResult: transformPerson,
  });

  if (!space) {
    return {
      spaceProps: {
        homeLink: paths.homePath(),
      },
      champion: champion as ProjectPage.Person | null,
      reviewer: reviewer as ProjectPage.Person | null | undefined,
    };
  }

  return {
    spaceProps: {
      workmapLink: paths.spaceWorkMapPath(space.id, "projects" as const),
      space: space as ProjectPage.Space,
      setSpace: setSpace as any,
      spaceSearch,

      setChampion,
      championSearch,

      setReviewer,
      reviewerSearch,
    },
    champion: champion as ProjectPage.Person | null,
    reviewer: reviewer as ProjectPage.Person | null | undefined,
  };
}

function useSpaceSearch(): (params: { query: string }) => Promise<ProjectPage.Space[]> {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<ProjectPage.Space[]> => {
    const data = await Api.spaces.search({ query: query });

    return data.spaces.map((space) => ({
      id: space.id!,
      name: space.name!,
      link: paths.spacePath(space.id!),
    }));
  };
}

function useParentGoalSearch(project: Projects.Project): ProjectPage.Props["parentGoalSearch"] {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<ProjectPage.ParentGoal[]> => {
    const data = await Api.projects.parentGoalSearch({ query: query.trim(), projectId: project.id });
    const goals = data.goals.map((g) => Goals.parseParentGoalForTurboUi(paths, g));

    return goals.map((g) => g!);
  };
}

function prepareContributors(paths: Paths, contributors: Projects.ProjectContributor[]): ProjectPage.Person[] {
  return contributors.map((c) => prepareContributor(paths, c)).filter(Boolean) as ProjectPage.Person[];
}

function prepareContributor(
  paths: Paths,
  contributor: Projects.ProjectContributor | null | undefined,
): ProjectPage.Person | null {
  if (!contributor?.person) {
    return null;
  }

  return {
    id: contributor.person.id,
    fullName: contributor.person.fullName,
    avatarUrl: contributor.person.avatarUrl || "",
    title: contributor.responsibility || "",
    profileLink: paths.profilePath(contributor.person.id),
  };
}

function prepareDiscussions(paths: Paths, discussions: Projects.Discussion[]): ProjectPage.Discussion[] {
  return discussions.map((discussion) => {
    assertPresent(discussion.title);

    return {
      id: discussion.id,
      date: Time.parse(discussion.insertedAt)!,
      title: discussion.title,
      author: People.parsePersonForTurboUi(paths, discussion.author)!,
      link: paths.projectDiscussionPath(discussion.id),
      content: JSON.parse(discussion.message || "{}"),
      commentCount: discussion.commentsCount || 0,
    };
  });
}

function prepareResources(resources: Projects.Resource[]): ProjectPage.Resource[] {
  return resources.map((r) => prepareResource(r));
}

function prepareResource(resource: Projects.Resource): ProjectPage.Resource {
  return {
    id: resource.id,
    name: resource.title,
    url: resource.link,
    type: resource.resourceType,
  };
}

function useMilestones(paths: Paths, project: Projects.Project, refresh?: () => Promise<void>) {
  assertPresent(project.milestones);
  const parsedMilestones = parseMilestonesForTurboUi(paths, project.milestones, project.milestonesOrderingState || []);

  const { milestones, setMilestones, reorderMilestones, orderingState } = Projects.useProjectMilestoneOrdering({
    projectId: project.id,
    cacheKey: pageCacheKey(project.id),
    refresh,
    initialMilestones: parsedMilestones.orderedMilestones,
    initialOrderingState: parsedMilestones.orderingState,
  });

  // Separate filtered list for MilestoneField - doesn't affect the main milestones list
  const [filteredMilestones, setFilteredMilestones] = React.useState(milestones);

  // Keep filtered list in sync with main milestones list
  React.useEffect(() => {
    setFilteredMilestones(milestones);
  }, [milestones]);

  const createMilestone = async (milestone: ProjectPage.NewMilestonePayload) => {
    return Api.projects
      .createMilestone({
        projectId: project.id,
        name: milestone.name,
        dueDate: serializeContextualDate(milestone.dueDate),
      })
      .then((data) => {
        PageCache.invalidate(pageCacheKey(project.id));
        setMilestones((prev) => [...prev, parseMilestoneForTurboUi(paths, data.milestone)]);

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to create milestone", e);
        showErrorToast("Error", "Failed to create milestone");

        return { success: false };
      });
  };

  const updateMilestone = async (milestoneId: string, updates: ProjectPage.UpdateMilestonePayload) => {
    return Api.projects
      .updateMilestone({
        projectId: project.id,
        milestoneId: milestoneId,
        name: updates.name,
        dueDate: serializeContextualDate(updates.dueDate),
      })
      .then((data) => {
        PageCache.invalidate(pageCacheKey(project.id));
        setMilestones((prev) =>
          prev.map((m) => {
            if (m.id === milestoneId) {
              return parseMilestoneForTurboUi(paths, data.milestone);
            }
            return m;
          }),
        );

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to update milestone", e);
        showErrorToast("Error", "Failed to update milestone");

        return { success: false };
      });
  };

  const searchMilestones = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      // Empty query - show all milestones
      setFilteredMilestones(milestones);
    } else {
      // Filter milestones by name
      const filtered = milestones.filter((m) => m.name.toLowerCase().includes(trimmedQuery));
      setFilteredMilestones(filtered);
    }
  };

  return {
    milestones,
    filteredMilestones,
    setMilestones,
    createMilestone,
    updateMilestone,
    reorderMilestones,
    searchMilestones,
    orderingState,
  };
}

function useResources(project: Projects.Project) {
  const [resources, setResources] = React.useState<ProjectPage.Resource[]>(prepareResources(project.keyResources!));

  const createResource = async (resource: ProjectPage.NewResourcePayload) => {
    return Api.addKeyResource({
      projectId: project.id,
      title: resource.name,
      link: resource.url,
      resourceType: resource.type,
    })
      .then((data) => {
        PageCache.invalidate(pageCacheKey(project.id));
        setResources((prev) => [...prev, prepareResource(data.keyResource)]);

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to create resource", e);
        showErrorToast("Error", "Failed to create resource");

        return { success: false };
      });
  };

  const updateResource = async (resource: ProjectPage.UpdateResourcePayload) => {
    return Api.editKeyResource({
      id: resource.id,
      title: resource.name,
      link: resource.url,
    })
      .then((data) => {
        PageCache.invalidate(pageCacheKey(project.id));
        setResources((prev) =>
          prev.map((r) => {
            if (r.id === resource.id) {
              return prepareResource(data.keyResource);
            }
            return r;
          }),
        );

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to update resource", e);
        showErrorToast("Error", "Failed to update resource");

        return { success: false };
      });
  };

  const removeResource = async (id: string) => {
    return Api.removeKeyResource({ id })
      .then(() => {
        PageCache.invalidate(pageCacheKey(project.id));
        assertPresent(project.keyResources);

        const updatedResources = project.keyResources.filter((r) => r.id !== id);
        setResources(prepareResources(updatedResources));

        return { success: true };
      })
      .catch((e) => {
        console.error("Failed to remove resource", e);
        showErrorToast("Error", "Failed to remove resource");

        return { success: false };
      });
  };

  return { resources, createResource, updateResource, removeResource };
}
