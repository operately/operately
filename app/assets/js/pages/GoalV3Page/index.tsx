import Api from "@/api";
import * as Activities from "@/models/activities";
import { PageModule } from "@/routes/types";
import * as Time from "@/utils/time";
import * as React from "react";
import * as Timeframes from "../../utils/timeframes";

import { Feed, useItemsQuery } from "@/features/Feed";
import { getGoal, Goal, Target } from "@/models/goals";
import { PageCache } from "@/routes/PageCache";
import { GoalPage } from "turboui";
import { useMentionedPersonLookupFn } from "../../contexts/CurrentCompanyContext";
import { getWorkMap, WorkMapItem } from "../../models/workMap";
import { Paths } from "../../routes/paths";
import { assertDefined, assertPresent } from "../../utils/assertions";

export default { name: "GoalV3Page", loader, Page } as PageModule;

function pageCacheKey(id: string): string {
  return `v7-GoalPage.goal-${id}`;
}

async function loader({ params, refreshCache = false }): Promise<[Goal, WorkMapItem[], Activities.Activity[]]> {
  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      Promise.all([
        getGoal({
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
        getWorkMap({
          parentGoalId: params.id,
          includeAssignees: true,
        }).then((d) => d.workMap!),
        Activities.getActivities({
          scopeType: "goal",
          scopeId: params.id,
          actions: ["goal_check_in"],
        }),
      ]),
  });
}

function Page() {
  const [goal, workMap, checkIns] = PageCache.useData(loader);
  const mentionedPersonLookup = useMentionedPersonLookupFn();

  assertPresent(goal.space);
  assertPresent(goal.privacy);
  assertPresent(goal.permissions?.canEdit);
  assertDefined(goal.champion);
  assertDefined(goal.reviewer);
  assertPresent(goal.timeframe);

  const peopleSearch = () => {
    throw new Error("peopleSearch function is not implemented");
  };

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
    timeframe: Timeframes.parse(goal.timeframe),
    parentGoal: prepareParentGoal(goal.parentGoal),
    canEdit: goal.permissions.canEdit,
    champion: goal.champion,
    reviewer: goal.reviewer,

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

    updateDueDate: function (date: Date | null): Promise<boolean> {
      const dueDate = date && Time.toDateWithoutTime(date);

      return Api.goals
        .updateDueDate({ goalId: goal.id!, dueDate: dueDate })
        .then(() => PageCache.invalidate(pageCacheKey(goal.id!)))
        .then(() => true)
        .catch((e) => {
          console.error("Failed to update goal due date", e);
          return false;
        });
    },

    activityFeed: <GoalFeedItems goalId={goal.id!} />,
  };

  return <GoalPage {...props} />;
}

function prepareCheckIns(checkIns: Activities.Activity[]): GoalPage.Props["checkIns"] {
  return checkIns.map((activity) => {
    const content = activity.content as Activities.ActivityContentGoalCheckIn;

    assertPresent(activity.author, "author must be present in activity");
    assertPresent(content.update, "update must be present in activity content");
    assertPresent(content.update.id, "update.id must be present in activity content");

    return {
      id: content.update.id,
      author: activity.author,
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
