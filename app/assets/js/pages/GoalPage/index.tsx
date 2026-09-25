import { useSpaceSearch } from "@/models/spaces";
import { useParentGoalSearch } from "@/models/goals/useParentGoalSearch";
import { GoalDiscussion, GoalProgressUpdate, GoalRetrospective } from "@/api";
import * as Goals from "@/models/goals";
import { PageModule } from "@/routes/types";
import * as React from "react";

import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";
import * as People from "@/models/people";
import * as Time from "@/utils/time";
import { GoalPage, showErrorToast, showSuccessToast, displayDate } from "turboui";
import { accessLevelsAsNumbers, accessLevelsAsStrings, Goal, parseParentGoalForTurboUi, Target } from "@/models/goals";
import { useNavigate } from "react-router";
import { WorkMapItem } from "../../models/workMap";
import { assertPresent } from "../../utils/assertions";

import { Feed, useFeedItemsQuery } from "@/features/Feed";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useRichTextHandlers } from "@/hooks/useRichTextHandlers";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import {
  useCreateFolder,
  useAddFileWidgetProps,
  useNewFileModalsContextValue,
  useResourceHubNodesListProps,
} from "@/models/resourceHubs";
import { parseSpaceForTurboUI } from "@/models/spaces";
import { useResourceHubSearchProps } from "@/models/search/resourceHub";
import { Paths, usePaths } from "@/routes/paths";
import {
  useResourceHubDocsQueries,
  type ResourceHubDocsAndFilesData as GoalDocsAndFilesData,
} from "@/models/resourceHubs/docsQueries";
import { useChecklists } from "./useChecklists";
import { loader, useLoadedData, useRefresh } from "./loader";
import { useGoalContentQueries } from "./contentQueries";
import { useOptimisticGoalState } from "@/models/goals/useOptimisticGoalState";
import { assertGoalMutationSucceeded } from "@/models/goals/goalMutation";
export default { name: "GoalPage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const { data, workMapInput, checkInsInput, discussionsInput } = useLoadedData();
  const refresh = useRefresh();
  const { goal, childrenCount } = data;
  const content = useGoalContentQueries({ workMapInput, checkInsInput, discussionsInput });
  const { workMap, checkIns, discussions } = content;
  const docs = useResourceHubDocsQueries(goal.resourceHub?.id);
  const refreshDocsAndGoal = React.useCallback(async () => {
    await Promise.all([docs.refresh(), refresh()]);
  }, [docs.refresh, refresh]);
  const currentUser = useMe();

  const updateName = Goals.useUpdateGoalName();
  const updateDescription = Goals.useUpdateGoalDescription();
  const updateAccessLevels = Goals.useUpdateGoalAccessLevels();
  const updateSpace = Goals.useUpdateGoalSpace();
  const updateStartDate = Goals.useUpdateGoalStartDate();
  const updateDueDate = Goals.useUpdateGoalDueDate();
  const updateChampion = Goals.useUpdateGoalChampion();
  const updateReviewer = Goals.useUpdateGoalReviewer();
  const updateParentGoal = Goals.useUpdateGoalParentGoal(goal.parentGoalId);
  const removeGoal = Goals.useDeleteGoal(goal.parentGoalId);

  const [goalName, setGoalName] = usePageField({
    value: (data) => data.goal.name,
    update: (v) => updateName.mutateAsync({ goalId: goal.id, name: v }),
    onError: (error) =>
      showErrorToast(
        typeof error === "string" ? error : "Network Error",
        "Reverted the goal name to its previous value.",
      ),
    validations: [(v) => (v.trim() === "" ? "Goal name cannot be empty" : null)],
  });

  const [description, setDescription] = usePageField({
    value: (data: { goal: Goal }) => data.goal.description && JSON.parse(data.goal.description),
    update: (v) => updateDescription.mutateAsync({ goalId: goal.id, description: JSON.stringify(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the description to its previous value."),
  });

  const [accessLevels, setAccessLevels] = usePageField({
    value: (data) => accessLevelsAsStrings(data.goal.accessLevels),
    update: (v) => updateAccessLevels.mutateAsync({ goalId: goal.id, accessLevels: accessLevelsAsNumbers(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the access levels to their previous values."),
  });

  const [space, setSpace] = usePageField({
    value: (data) => (data.goal.space ? parseSpaceForTurboUI(paths, data.goal.space) : null),
    update: (v) => {
      if (!v) return Promise.resolve({ success: false });

      return updateSpace.mutateAsync({ goalId: goal.id, spaceId: v.id });
    },
    onError: () => showErrorToast("Network Error", "Reverted the space to its previous value."),
  });

  const [startDate, setStartDate] = usePageField({
    value: (data: { goal: Goal }) => parseContextualDate(data.goal.timeframe?.contextualStartDate),
    update: (v) => updateStartDate.mutateAsync({ goalId: goal.id, startDate: serializeContextualDate(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the start date to its previous value."),
  });

  const [dueDate, setDueDate] = usePageField({
    value: (data: { goal: Goal }) => parseContextualDate(data.goal.timeframe?.contextualEndDate),
    update: (v) => updateDueDate.mutateAsync({ goalId: goal.id, dueDate: serializeContextualDate(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the due date to its previous value."),
  });

  const [champion, setChampion] = usePageField({
    value: (data) => People.parsePersonForTurboUi(paths, data.goal.champion),
    update: (v) => updateChampion.mutateAsync({ goalId: goal.id, championId: v && v.id }),
    onError: () => showErrorToast("Network Error", "Reverted the champion to its previous value."),
  });

  const [reviewer, setReviewer] = usePageField({
    value: (data) => People.parsePersonForTurboUi(paths, data.goal.reviewer),
    update: (v) => updateReviewer.mutateAsync({ goalId: goal.id, reviewerId: v && v.id }),
    onError: () => showErrorToast("Network Error", "Reverted the reviewer to its previous value."),
  });

  const [parentGoal, setParentGoal] = usePageField({
    value: (data) => parseParentGoalForTurboUi(paths, data.goal.parentGoal),
    update: (v) => updateParentGoal.mutateAsync({ goalId: goal.id, parentGoalId: v && v.id }),
    onError: () => showErrorToast("Network Error", "Reverted the parent goal to its previous value."),
    onSuccess: () => showSuccessToast("Parent Goal Updated", "The parent goal has been successfully changed."),
  });

  // Transform function must be memoized to prevent infinite loop in the hook
  const transformPerson = React.useCallback((p) => People.parsePersonForTurboUi(paths, p)!, [paths]);

  // ignoredIds must be memoized to prevent infinite loop in the hook
  const ignoredIds = React.useMemo(
    () => [champion?.id, reviewer?.id].filter((id): id is string => id !== undefined),
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

  const parentGoalSearch = useParentGoalSearch({ type: "goal", id: goal.id });
  const spaceSearch = useSpaceSearch();

  const richTextHandlers = useRichTextHandlers({
    taskList: {
      resourceType: "goal",
      resourceId: goal.id,
      field: "description",
      canEdit: goal.permissions?.canEdit ?? false,
    },
    scope: { type: "goal", id: goal.id },
  });
  const formattedTimePreferences = useFormattedTimePreferences();

  const initialChecklist = React.useMemo(() => goal.checklist ?? [], [goal.checklist]);
  const checklists = useChecklists({ goalId: goal.id, initialChecklist });
  const goalDocsAndFilesProps = useGoalDocsAndFilesProps({
    docsAndFiles: docs.data,
    goalId: goal.id,
    onRefresh: refreshDocsAndGoal,
  });

  const initialTargets = React.useMemo(() => prepareTargets(goal.targets), [goal.targets]);

  const { targets, addTarget, deleteTarget, updateTarget, updateTargetValue, updateTargetIndex } = Goals.useGoalTargets(
    { goalId: goal.id, initialTargets },
  );

  const deleteGoal = async () => {
    try {
      await removeGoal.mutateAsync({ goalId: goal.id });

      if (space?.id) {
        navigate(paths.spaceWorkMapPath(space.id, "goals"));
      } else {
        navigate(paths.homePath());
      }
    } catch (error) {
      console.error("Failed to delete goal:", error);
      showErrorToast("Something went wrong", "Failed to delete the goal. Please try again.");
    }
  };

  const exportMarkdown = React.useCallback(() => {
    window.open(paths.goalMarkdownExportPath(goal.id), "_blank", "noopener");
  }, [goal.id, paths]);

  const spaceProps: GoalPage.SpaceProps = space
    ? {
        workmapLink: paths.spaceWorkMapPath(space.id, "goals"),
        addSubprojectLink: paths.newProjectPath({ goalId: goal.id, spaceId: space.id }),
        addSubgoalLink: paths.newGoalPath({ parentGoalId: goal.id, spaceId: space.id }),
        space: space as GoalPage.Space,
        setSpace: setSpace as any,
        spaceSearch,
      }
    : {
        companyWorkMapLink: paths.workMapPath("goals"),
      };

  const props: GoalPage.Props = {
    ...spaceProps,
    closeLink: paths.goalClosePath(goal.id),
    reopenLink: paths.goalReopenPath(goal.id),
    newCheckInLink: paths.goalCheckInNewPath(goal.id),
    newDiscussionLink: paths.newGoalDiscussionPath(goal.id),
    manageAccessLink: paths.goalAccessManagementPath(goal.id),
    exportMarkdown,
    closedAt: Time.parse(goal.closedAt),
    retrospective: prepareRetrospective(paths, goal.retrospective),
    neglectedGoal: false,
    permissions: goal.permissions,
    deleteGoal,

    goalName,
    setGoalName,

    accessLevels,
    setAccessLevels,

    parentGoal,
    setParentGoal,
    parentGoalSearch,

    dueDate,
    setDueDate,
    startDate,
    setStartDate,

    champion,
    setChampion,
    championSearch,

    reviewer,
    setReviewer,
    reviewerSearch,

    description,
    onDescriptionChange: setDescription,

    status: goal.status,
    state: goal.closedAt ? "closed" : "active",
    targets,
    checkIns: prepareCheckIns(paths, checkIns),
    discussions: prepareDiscussions(paths, discussions),
    childrenCount,
    checkInsLoading: content.checkInsLoading,
    checkInsError: content.checkInsError,
    onRetryCheckIns: content.retryCheckIns,
    discussionsLoading: content.discussionsLoading,
    discussionsError: content.discussionsError,
    onRetryDiscussions: content.retryDiscussions,
    relatedWorkLoading: content.relatedWorkLoading,
    relatedWorkError: content.relatedWorkError,
    onRetryRelatedWork: content.retryRelatedWork,
    docsAndFiles: goalDocsAndFilesProps,
    docsAndFilesAvailable: docs.available,
    docsAndFilesLoading: docs.loading,
    docsAndFilesError: docs.error,
    onRetryDocsAndFiles: docs.retry,
    contributors: [],
    relatedWorkItems: prepareWorkMapData(workMap),
    currentUser: currentUser ? People.parsePersonForTurboUi(paths, currentUser) : null,

    richTextHandlers,
    localDraftKeyBase: `goal:${goal.id}`,

    addTarget,
    deleteTarget,
    updateTarget,
    updateTargetValue,
    updateTargetIndex,

    checklistItems: checklists.items,
    addChecklistItem: checklists.add,
    deleteChecklistItem: checklists.delete,
    updateChecklistItem: checklists.update,
    toggleChecklistItem: checklists.toggle,
    updateChecklistItemIndex: checklists.updateIndex,

    activityFeed: <GoalFeedItems goalId={goal.id} />,
    formattedTimePreferences,
  };

  return <GoalPage key={goal.id} {...props} />;
}

interface PageFieldProps<T> {
  value: (data: ReturnType<typeof useLoadedData>["data"]) => T;
  update: (value: T) => Promise<unknown>;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
  validations?: ((value: T) => string | null)[];
}

export function usePageField<T>({
  value,
  update,
  onError,
  onSuccess,
  validations,
}: PageFieldProps<T>): [T, (value: T) => Promise<boolean>] {
  const { data } = useLoadedData();
  const select = React.useRef(value);
  select.current = value;
  const serverValue = React.useMemo(() => select.current(data), [data]);
  const state = useOptimisticGoalState(data.goal.id, serverValue);

  const save = async (newValue: T) => {
    for (const validate of validations ?? []) {
      const error = validate(newValue);
      if (error) {
        onError?.(error);
        return false;
      }
    }
    try {
      await state.run(
        () => newValue,
        async () => {
          const result = await update(newValue);
          assertGoalMutationSucceeded(result);
          return result;
        },
      );
      onSuccess?.();
      return true;
    } catch (error) {
      console.error("API update failed", error);
      onError?.(error);
      return false;
    }
  };

  return [state.value, save];
}

function useGoalDocsAndFilesProps({
  docsAndFiles,
  goalId,
  onRefresh,
}: {
  docsAndFiles: GoalDocsAndFilesData | null;
  goalId: string;
  onRefresh?: () => Promise<void>;
}): GoalPage.Props["docsAndFiles"] {
  const paths = usePaths();
  const resourceHub = docsAndFiles?.resourceHub;
  const refresh = React.useCallback(() => {
    void onRefresh?.();
  }, [onRefresh]);
  const newFileModals = useNewFileModalsContextValue({ resourceHub });
  const addFileWidgetProps = useAddFileWidgetProps({ resourceHub, onUploaded: refresh });
  const { mutateAsync: createFolder } = useCreateFolder();
  const nodesListProps = useResourceHubNodesListProps(
    resourceHub
      ? {
          resourceHub,
          type: "resource_hub",
          nodes: docsAndFiles?.nodes || [],
          refetch: refresh,
        }
      : null,
  );
  const search = useResourceHubSearchProps(resourceHub?.id);

  return React.useMemo(() => {
    if (!docsAndFiles || !resourceHub?.id) {
      return undefined;
    }

    return {
      resourceHub,
      previewNodes: docsAndFiles.nodes,
      tabPath: paths.goalPath(goalId, { tab: "docs-and-files" }),
      drafts: {
        nodes: docsAndFiles.draftNodes,
        draftsPath: paths.resourceHubDraftsPath(resourceHub.id),
      },
      newFileModals,
      addFileWidgetProps,
      nodesListProps,
      search,
      addFolderModalProps: {
        resourceHubId: resourceHub.id,
        onCreated: refresh,
        onCreateFolder: async (args) => {
          await createFolder({
            resourceHubId: args.resourceHubId,
            folderId: args.folderId,
            name: args.name,
          });
        },
      },
    };
  }, [
    addFileWidgetProps,
    createFolder,
    docsAndFiles,
    goalId,
    newFileModals,
    nodesListProps,
    paths,
    refresh,
    resourceHub,
    search,
  ]);
}

function prepareCheckIns(paths: Paths, checkIns: GoalProgressUpdate[]): GoalPage.Props["checkIns"] {
  return checkIns.map((checkIn) => {
    return {
      id: checkIn.id,
      author: People.parsePersonForTurboUi(paths, checkIn.author),
      date: Time.parse(displayDate(checkIn))!,
      link: paths.goalCheckInPath(checkIn.id),
      content: JSON.parse(checkIn.message!),
      commentCount: checkIn.commentsCount!,
      status: checkIn.status!,
      state: checkIn.state,
      scheduledAt: checkIn.scheduledAt,
    };
  });
}

function prepareWorkMapData(items: WorkMapItem[]): GoalPage.Props["relatedWorkItems"] {
  return items.map((item) => {
    assertPresent(item.assignees);
    return { ...item, children: prepareWorkMapData(item.children), assignees: item.assignees };
  });
}

function GoalFeedItems({ goalId }: { goalId: string }) {
  const { data, loading, error, pagination } = useFeedItemsQuery("goal", goalId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <Feed pagination={pagination} items={data?.activities || []} page="goal" testId="goal-feed" />;
}

function prepareTargets(targets: Target[] | null | undefined): GoalPage.Props["targets"] {
  if (!targets) return [];

  return targets.map((target) => {
    assertPresent(target.id);
    assertPresent(target.name);
    assertPresent(target.from);
    assertPresent(target.to);
    assertPresent(target.value);
    assertPresent(target.unit);
    assertPresent(target.index);

    return {
      name: target.name,
      id: target.id,
      from: target.from,
      to: target.to,
      value: target.value,
      unit: target.unit,
      index: target.index,
      mode: "view" as const,
    };
  });
}

function prepareDiscussions(paths: Paths, discussions: GoalDiscussion[]): GoalPage.Props["discussions"] {
  return discussions.map((discussion) => {
    return {
      id: discussion.id,
      date: Time.parse(discussion.insertedAt)!,
      title: discussion.title,
      author: People.parsePersonForTurboUi(paths, discussion.author)!,
      link: paths.goalDiscussionPath(discussion.activityId),
      content: JSON.parse(discussion.content),
      commentCount: discussion.commentCount,
    };
  });
}

function prepareRetrospective(
  paths: Paths,
  retrospective: GoalRetrospective | null | undefined,
): GoalPage.Props["retrospective"] {
  if (!retrospective) {
    return null;
  }

  return {
    link: paths.goalRetrospectivePath(retrospective.id),
    date: Time.parse(retrospective.insertedAt)!,
    content: JSON.parse(retrospective.content),
    author: People.parsePersonForTurboUi(paths, retrospective.author)!,
  };
}
