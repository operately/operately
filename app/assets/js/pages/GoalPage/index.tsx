import Api, { GoalDiscussion, GoalProgressUpdate, GoalRetrospective } from "@/api";
import * as Goals from "@/models/goals";
import { PageModule } from "@/routes/types";
import * as React from "react";

import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";
import * as People from "@/models/people";
import * as Time from "@/utils/time";

import { Feed, useItemsQuery } from "@/features/Feed";
import {
  accessLevelsAsNumbers,
  accessLevelsAsStrings,
  getGoal,
  Goal,
  parseParentGoalForTurboUi,
  Target,
} from "@/models/goals";
import { PageCache } from "@/routes/PageCache";
import { useNavigate } from "react-router-dom";
import { GoalPage, showErrorToast, showSuccessToast } from "turboui";
import { getWorkMap, WorkMapItem } from "../../models/workMap";
import { assertPresent } from "../../utils/assertions";
import { fetchAll } from "../../utils/async";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseSpaceForTurboUI } from "@/models/spaces";
import { Paths, usePaths } from "@/routes/paths";
import { useAiSidebar } from "../../features/AiSidebar";
import { useChecklists } from "./useChecklists";
export default { name: "GoalPage", loader, Page } as PageModule;

export function pageCacheKey(id: string): string {
  return `v31-GoalPage.goal-${id}`;
}

type LoaderResult = {
  data: {
    goal: Goal;
    workMap: WorkMapItem[];
    checkIns: GoalProgressUpdate[];
    checklist: Goals.Check[];
    discussions: GoalDiscussion[];
  };

  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      fetchAll({
        goal: getGoal({
          id: params.id,
          includeSpace: true,
          includeChampion: true,
          includeReviewer: true,
          includePermissions: true,
          includeUnreadNotifications: true,
          includeLastCheckIn: true,
          includeAccessLevels: true,
          includePrivacy: true,
          includeRetrospective: true,
          includeChecklist: true,
        }).then((d) => d.goal),
        workMap: getWorkMap({ parentGoalId: params.id, includeAssignees: true }).then((d) => d.workMap),
        checkIns: Api.goals.getCheckIns({ goalId: params.id }).then((d) => d.checkIns),
        discussions: Api.goals.getDiscussions({ goalId: params.id }).then((d) => d.discussions),
      }),
  });
}

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const { data, refresh } = PageCache.useData(loader);
  const { goal, workMap, checkIns, discussions } = data;
  const currentUser = useMe();

  assertPresent(goal.privacy);
  assertPresent(goal.permissions?.canEdit);

  useAiSidebar({
    conversationContext: {
      id: goal.id,
      type: "goal",
      title: goal.name,
      url: paths.goalPath(goal.id),
    },
  });

  const [goalName, setGoalName] = usePageField({
    value: (data) => data.goal.name,
    update: (v) => Api.goals.updateName({ goalId: goal.id, name: v }),
    onError: (e: string) => showErrorToast(e, "Reverted the goal name to its previous value."),
    validations: [(v) => (v.trim() === "" ? "Goal name cannot be empty" : null)],
  });

  const [description, setDescription] = usePageField({
    value: (data: { goal: Goal }) => data.goal.description && JSON.parse(data.goal.description),
    update: (v) => Api.goals.updateDescription({ goalId: goal.id, description: JSON.stringify(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the description to its previous value."),
  });

  const [accessLevels, setAccessLevels] = usePageField({
    value: (data) => accessLevelsAsStrings(data.goal.accessLevels),
    update: (v) => Api.goals.updateAccessLevels({ goalId: goal.id, accessLevels: accessLevelsAsNumbers(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the access levels to their previous values."),
  });

  const [space, setSpace] = usePageField({
    value: (data) => (data.goal.space ? parseSpaceForTurboUI(paths, data.goal.space) : null),
    update: (v) => {
      if (!v) return Promise.resolve({ success: false });

      return Api.goals.updateSpace({ goalId: goal.id, spaceId: v.id });
    },
    onError: () => showErrorToast("Network Error", "Reverted the space to its previous value."),
  });

  const [startDate, setStartDate] = usePageField({
    value: (data: { goal: Goal }) => parseContextualDate(data.goal.timeframe?.contextualStartDate),
    update: (v) => Api.goals.updateStartDate({ goalId: goal.id, startDate: serializeContextualDate(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the start date to its previous value."),
  });

  const [dueDate, setDueDate] = usePageField({
    value: (data: { goal: Goal }) => parseContextualDate(data.goal.timeframe?.contextualEndDate),
    update: (v) => Api.goals.updateDueDate({ goalId: goal.id, dueDate: serializeContextualDate(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the due date to its previous value."),
  });

  const [champion, setChampion] = usePageField({
    value: (data) => People.parsePersonForTurboUi(paths, data.goal.champion),
    update: (v) => Api.goals.updateChampion({ goalId: goal.id, championId: v && v.id }),
    onError: () => showErrorToast("Network Error", "Reverted the champion to its previous value."),
  });

  const [reviewer, setReviewer] = usePageField({
    value: (data) => People.parsePersonForTurboUi(paths, data.goal.reviewer),
    update: (v) => Api.goals.updateReviewer({ goalId: goal.id, reviewerId: v && v.id }),
    onError: () => showErrorToast("Network Error", "Reverted the reviewer to its previous value."),
  });

  const [parentGoal, setParentGoal] = usePageField({
    value: (data) => parseParentGoalForTurboUi(paths, data.goal.parentGoal),
    update: (v) => Api.goals.updateParentGoal({ goalId: goal.id, parentGoalId: v && v.id }),
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

  const parentGoalSearch = useParentGoalSearch(goal);
  const spaceSearch = useSpaceSearch();

  const richEditorHandlers = useRichEditorHandlers({ scope: { type: "goal", id: goal.id } });

  const checklists = useChecklists({ goalId: goal.id, initialChecklist: goal.checklist || [] });

  const initialTargets = React.useMemo(() => prepareTargets(goal.targets), [goal.targets]);

  const { targets, setTargets, addTarget, deleteTarget, updateTarget, updateTargetValue, updateTargetIndex } =
    Goals.useGoalTargets({ goalId: goal.id, cacheKey: pageCacheKey(goal.id), initialTargets, refresh });

  React.useEffect(() => {
    setTargets(initialTargets);
  }, [initialTargets, setTargets]);

  const deleteGoal = async () => {
    try {
      await Api.deleteGoal({ goalId: goal.id });
      PageCache.invalidate(pageCacheKey(goal.id));

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
    contributors: [],
    relatedWorkItems: prepareWorkMapData(workMap),
    currentUser: currentUser ? People.parsePersonForTurboUi(paths, currentUser) : null,

    richTextHandlers: richEditorHandlers,

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
  };

  return <GoalPage key={goal.id} {...props} />;
}

function prepareCheckIns(paths: Paths, checkIns: GoalProgressUpdate[]): GoalPage.Props["checkIns"] {
  return checkIns.map((checkIn) => {
    assertPresent(checkIn.author, "author must be present in check-in");

    return {
      id: checkIn.id,
      author: People.parsePersonForTurboUi(paths, checkIn.author)!,
      date: Time.parse(checkIn.insertedAt)!,
      link: paths.goalCheckInPath(checkIn.id),
      content: JSON.parse(checkIn.message!),
      commentCount: checkIn.commentsCount!,
      status: checkIn.status!,
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
  const { data, loading, error } = useItemsQuery("goal", goalId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <Feed items={data?.activities || []} page="goal" testId="goal-feed" />;
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

interface usePageFieldProps<T> {
  value: (LoaderResult) => T;
  update: (newValue: T) => Promise<{ success?: boolean | null } | boolean | null | undefined>;
  onError?: (error: any) => void;
  onSuccess?: () => void;
  validations?: ((newValue: T) => string | null)[];
}

function usePageField<T>({
  value,
  update,
  onError,
  onSuccess,
  validations,
}: usePageFieldProps<T>): [T, (v: T) => Promise<boolean>] {
  const { data, cacheVersion } = PageCache.useData(loader, { refreshCache: false });

  const [state, setState] = React.useState<T>(() => value(data));
  const [stateVersion, setStateVersion] = React.useState<number | undefined>(cacheVersion);

  React.useEffect(() => {
    if (cacheVersion !== stateVersion) {
      setState(() => value(data));
      setStateVersion(cacheVersion);
    }
  }, [value, cacheVersion, stateVersion]);

  const updateState = (newVal: T): Promise<boolean> => {
    return new Promise((resolve) => {
      // Run validations if provided
      if (validations) {
        for (const validate of validations) {
          const error = validate(newVal);

          if (error) {
            console.error("Validation failed:", error);
            console.log("Reverting to previous value", value(data));
            setState(value(data)); // revert to previous value
            onError?.(error);
            resolve(false);
            return;
          }
        }
      }

      const oldVal = state;

      const successHandler = () => {
        PageCache.invalidate(pageCacheKey(data.goal.id));
        onSuccess?.();
        resolve(true);
      };

      const errorHandler = (error: any) => {
        onError?.(error);

        console.error("API update failed", error);
        setState(oldVal);
        resolve(false);
      };

      setState(newVal);

      update(newVal)
        .then((res) => {
          if (res === true || (typeof res === "object" && res?.success !== false)) {
            successHandler();
          } else {
            errorHandler("Network Error");
          }
        })
        .catch(errorHandler);
    });
  };

  return [state, updateState];
}

function prepareDiscussions(paths: Paths, discussions: GoalDiscussion[]): GoalPage.Props["discussions"] {
  return discussions.map((discussion) => {
    return {
      id: discussion.id,
      date: Time.parse(discussion.insertedAt)!,
      title: discussion.title,
      author: People.parsePersonForTurboUi(paths, discussion.author)!,
      link: paths.goalDiscussionPath(discussion.id),
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

function useParentGoalSearch(goal: Goal): GoalPage.Props["parentGoalSearch"] {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<GoalPage.ParentGoal[]> => {
    const data = await Api.goals.parentGoalSearch({ query: query.trim(), goalId: goal.id });
    const goals = data.goals.map((g) => parseParentGoalForTurboUi(paths, g));

    return goals.map((g) => g!);
  };
}

function useSpaceSearch(): (params: { query: string }) => Promise<GoalPage.Space[]> {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<GoalPage.Space[]> => {
    const data = await Api.spaces.search({ query: query });

    return data.spaces.map((space) => ({
      id: space.id,
      name: space.name,
      link: paths.spacePath(space.id),
    }));
  };
}
