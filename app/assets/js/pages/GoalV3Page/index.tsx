import Api from "@/api";
import * as Activities from "@/models/activities";
import * as People from "@/models/people";
import { PageModule } from "@/routes/types";
import * as Time from "@/utils/time";
import * as React from "react";

import { Feed, useItemsQuery } from "@/features/Feed";
import { getGoal, Goal, Target } from "@/models/goals";
import { PageCache } from "@/routes/PageCache";
import { GoalPage, showErrorToast } from "turboui";
import { useMentionedPersonLookupFn } from "../../contexts/CurrentCompanyContext";
import { getWorkMap, WorkMapItem } from "../../models/workMap";
import { Paths } from "../../routes/paths";
import { assertPresent } from "../../utils/assertions";
import { fetchAll } from "../../utils/async";

export default { name: "GoalV3Page", loader, Page } as PageModule;

function pageCacheKey(id: string): string {
  return `v13-GoalPage.goal-${id}`;
}

type LoaderResult = {
  data: {
    goal: Goal;
    workMap: WorkMapItem[];
    checkIns: Activities.Activity[];
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
        }).then((d) => d.goal!),
        workMap: getWorkMap({
          parentGoalId: params.id,
          includeAssignees: true,
        }).then((d) => d.workMap!),
        checkIns: Activities.getActivities({
          scopeType: "goal",
          scopeId: params.id,
          actions: ["goal_check_in"],
        }),
      }),
  });
}

function Page() {
  const { goal, workMap, checkIns } = PageCache.useData(loader).data;

  const mentionedPersonLookup = useMentionedPersonLookupFn();

  assertPresent(goal.space);
  assertPresent(goal.privacy);
  assertPresent(goal.permissions?.canEdit);

  const [dueDate, setDueDate] = usePageField({
    value: (data) => Time.parse(data.goal.dueDate),
    update: (v) => Api.goals.updateDueDate({ goalId: goal.id!, dueDate: v && Time.toDateWithoutTime(v) }),
    onError: () => showErrorToast("Network Error", "Reverted the due date to its previous value."),
  });

  const [champion, setChampion] = usePageField({
    value: (data) => preparePerson(data.goal.champion),
    update: (v) => Api.goals.updateChampion({ goalId: goal.id!, championId: v && v.id }),
    onError: () => showErrorToast("Network Error", "Reverted the champion to its previous value."),
  });

  const [reviewer, setReviewer] = usePageField({
    value: (data) => preparePerson(data.goal.reviewer),
    update: (v) => Api.goals.updateReviewer({ goalId: goal.id!, reviewerId: v && v.id }),
    onError: () => showErrorToast("Network Error", "Reverted the reviewer to its previous value."),
  });

  const championSearch = usePeopleSearch({
    scope: { type: "space", id: goal.space.id! },
    ignoredIds: [goal.champion?.id!, goal.reviewer?.id!],
    transformResult: (p) => preparePerson(p)!,
  });

  const reviewerSearch = usePeopleSearch({
    scope: { type: "space", id: goal.space.id! },
    ignoredIds: [goal.champion?.id!, goal.reviewer?.id!],
    transformResult: (p) => preparePerson(p)!,
  });

  const props: GoalPage.Props = {
    goalName: goal.name,
    spaceName: goal.space.name,
    workmapLink: Paths.spaceGoalsPath(goal.space.id),
    spaceLink: Paths.spacePath(goal.space.id),
    closeLink: Paths.goalClosePath(goal.id),
    editGoalLink: Paths.goalEditPath(goal.id),
    newCheckInLink: Paths.goalCheckInNewPath(goal.id),
    addSubprojectLink: Paths.newProjectPath({ goalId: goal.id!, spaceId: goal.space!.id! }),
    addSubgoalLink: Paths.newGoalPath({ parentGoalId: goal.id!, spaceId: goal.space!.id! }),

    privacyLevel: goal.privacy,
    parentGoal: prepareParentGoal(goal.parentGoal),
    canEdit: goal.permissions.canEdit,

    dueDate,
    setDueDate,

    champion,
    setChampion,
    championSearch,

    reviewer,
    setReviewer,
    reviewerSearch,

    description: goal.description && JSON.parse(goal.description),
    deleteLink: "",
    status: goal.status,
    targets: prepareTargets(goal.targets),
    checkIns: prepareCheckIns(checkIns),
    messages: [],
    contributors: [],
    relatedWorkItems: prepareWorkMapData(workMap),
    mentionedPersonLookup,
    peopleSearch,

    addTarget: function (inputs): Promise<{ id: string; success: boolean }> {
      return Api.goals
        .addTarget({ ...inputs, goalId: goal.id! })
        .then((data) => {
          PageCache.invalidate(pageCacheKey(goal.id!));

          return { id: data.targetId!, success: true };
        })
        .catch((e) => {
          console.error("Failed to add target", e);

          return { id: "", success: false };
        });
    },

    deleteTarget: function (id: string): Promise<boolean> {
      return Api.goals
        .deleteTarget({ goalId: goal.id!, targetId: id })
        .then(() => {
          PageCache.invalidate(pageCacheKey(goal.id!));
          return true;
        })
        .catch((e) => {
          console.error("Failed to delete target", e);
          return false;
        });
    },

    updateTarget: function (inputs): Promise<boolean> {
      return Api.goals
        .updateTarget({ ...inputs, goalId: goal.id! })
        .then(() => {
          PageCache.invalidate(pageCacheKey(goal.id!));
          return true;
        })
        .catch((e) => {
          console.error("Failed to update target", e);
          return false;
        });
    },

    updateTargetValue: function (id: string, value: number): Promise<boolean> {
      return Api.goals
        .updateTargetValue({ goalId: goal.id!, targetId: id, value })
        .then(() => {
          PageCache.invalidate(pageCacheKey(goal.id!));
          return true;
        })
        .catch((e) => {
          console.error("Failed to update target value", e);
          return false;
        });
    },

    updateTargetIndex: function (id: string, index: number): Promise<boolean> {
      return Api.goals
        .updateTargetIndex({ goalId: goal.id!, targetId: id, index })
        .then(() => {
          PageCache.invalidate(pageCacheKey(goal.id!));
          return true;
        })
        .catch((e) => {
          console.error("Failed to update target index", e);
          return false;
        });
    },

    updateGoalName: function (name: string): Promise<boolean> {
      if (name.trim() === "") {
        return Promise.resolve(false);
      } else {
        return Api.goals
          .updateName({ goalId: goal.id!, name })
          .then(() => PageCache.invalidate(pageCacheKey(goal.id!)))
          .then(() => true)
          .catch((e) => {
            console.error("Failed to update goal name", e);
            return false;
          });
      }
    },

    updateDescription: function (description: any | null): Promise<boolean> {
      return Api.goals
        .updateDescription({ goalId: goal.id!, description: JSON.stringify(description) })
        .then(() => PageCache.invalidate(pageCacheKey(goal.id!)))
        .then(() => true)
        .catch((e) => {
          console.error("Failed to update goal description", e);
          return false;
        });
    },

    activityFeed: <GoalFeedItems goalId={goal.id!} />,
  };

  return <GoalPage {...props} />;
}

function preparePerson(person: People.Person | null | undefined) {
  if (!person) {
    return null;
  } else {
    return {
      id: person.id!,
      fullName: person.fullName!,
      title: person.title || "",
      avatarUrl: person.avatarUrl || "",
      profileLink: Paths.profilePath(person.id!),
    };
  }
}

function prepareCheckIns(checkIns: Activities.Activity[]): GoalPage.Props["checkIns"] {
  return checkIns.map((activity) => {
    const content = activity.content as Activities.ActivityContentGoalCheckIn;

    assertPresent(activity.author, "author must be present in activity");
    assertPresent(content.update, "update must be present in activity content");
    assertPresent(content.update.id, "update.id must be present in activity content");

    return {
      id: content.update.id,
      author: preparePerson(activity.author)!,
      date: Time.parse(content.update.insertedAt!)!,
      link: Paths.goalCheckInPath(content.update.id!),
      content: JSON.parse(content.update.message!),
      commentCount: 4,
      status: content.update.status!,
    };
  });
}

function prepareParentGoal(g: Goal | null | undefined): GoalPage.Props["parentGoal"] {
  if (!g) {
    return null;
  } else {
    return { link: Paths.goalPath(g!.id!), name: g!.name! };
  }
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
  if (!data) return null;

  return <Feed items={data!.activities!} page="goal" testId="goal-feed" />;
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

const peopleSearch = async () => {
  return [];
};

interface usePageFieldProps<T> {
  value: (LoaderResult) => T;
  update: (newValue: T) => Promise<{ success?: boolean | null } | boolean | null | undefined>;
  onError?: (error: any) => void;
}

function usePageField<T>({ value, update, onError }: usePageFieldProps<T>): [T, (v: T) => void] {
  const { data, cacheVersion } = PageCache.useData(loader, { refreshCache: false });

  const [state, setState] = React.useState<T>(() => value(data));
  const [stateVersion, setStateVersion] = React.useState<number | undefined>(cacheVersion);

  React.useEffect(() => {
    if (cacheVersion !== stateVersion) {
      setState(() => value(data));
      setStateVersion(cacheVersion);
    }
  }, [value, cacheVersion, stateVersion]);

  const updateState = (newVal: T): void => {
    const oldVal = state;

    const successHandler = () => {
      PageCache.invalidate(pageCacheKey(data.goal.id!));
    };

    const errorHandler = (error: any) => {
      onError?.(error);

      console.error("API update failed", error);
      setState(oldVal);
    };

    setState(newVal);

    update(newVal)
      .then((res) => {
        if (res === true || (typeof res === "object" && res?.success)) {
          successHandler();
        } else {
          errorHandler("API call returned false, reverting state");
        }
      })
      .catch(errorHandler);
  };

  return [state, updateState];
}

interface UsePeopleSearch<T> {
  ignoredIds?: string[];
  scope: People.SearchScope;
  transformResult?: (people: People.Person) => T;
}

interface PeopleSearchParams {
  query: string;
  ignoredIds?: string[];
}

type PeopleSearchFn<T> = (callParams: PeopleSearchParams) => Promise<T[]>;

function usePeopleSearch<T>(hookParams: UsePeopleSearch<T>): PeopleSearchFn<T> {
  const transform = hookParams.transformResult || ((person) => person as unknown as T);

  return async (callParams: PeopleSearchParams): Promise<T[]> => {
    const params = { ...hookParams, ...callParams };

    const result = await Api.searchPeople({
      query: params.query,
      ignoredIds: params.ignoredIds || [],
      searchScopeType: params.scope.type,
      searchScopeId: params.scope.id,
    });

    const people = result.people || [];
    return people.map((person) => transform(person!)) as T[];
  };
}
