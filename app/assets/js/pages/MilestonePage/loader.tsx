import Api, { Activity, Milestone, ProjectChildrenCount, Task } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { MILESTONE_ACTIVITY_TYPES } from "@/models/activities/feed";
import { useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const milestoneInput = {
    id: params.id,
    includeProject: true,
    includeCreator: true,
    includeSpace: true,
    includePermissions: true,
    includeComments: true,
    includeSubscriptionList: true,
    includeAvailableStatuses: true,
  };
  const tasksInput = { milestoneId: params.id };
  const childrenCountInput = { id: params.id, useMilestoneId: true };
  const activitiesInput = {
    scopeId: params.id,
    scopeType: "milestone" as const,
    actions: MILESTONE_ACTIVITY_TYPES,
  };

  await Promise.all([
    Api.projects.getMilestoneQuery(milestoneInput),
    Api.projects.listMilestoneTasksQuery(tasksInput),
    Api.projects.countChildrenQuery(childrenCountInput),
    Api.companies.listActivitiesQuery(activitiesInput),
  ]);

  return { milestoneInput, tasksInput, childrenCountInput, activitiesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): {
  milestone: Milestone;
  tasks: Task[];
  childrenCount: ProjectChildrenCount;
  activities: Activity[];
} {
  const { milestoneInput, tasksInput, childrenCountInput, activitiesInput } = Pages.useLoadedData<LoaderResult>();
  const { data: milestoneData } = useLoadedQuery(Api.projects.getMilestoneQueryOptions(milestoneInput));
  const { data: tasksData } = useLoadedQuery(Api.projects.listMilestoneTasksQueryOptions(tasksInput));
  const { data: childrenCountData } = useLoadedQuery(Api.projects.countChildrenQueryOptions(childrenCountInput));
  const { data: activitiesData } = useLoadedQuery(Api.companies.listActivitiesQueryOptions(activitiesInput));

  if (!milestoneData?.milestone) {
    throw new Error(`Milestone data is unavailable for milestone "${milestoneInput.id}"`);
  }

  if (!tasksData || !childrenCountData || !activitiesData) {
    throw new Error(`Supporting data is unavailable for milestone "${milestoneInput.id}"`);
  }

  return {
    milestone: milestoneData.milestone,
    tasks: tasksData.tasks,
    childrenCount: childrenCountData.childrenCount,
    activities: activitiesData.activities,
  };
}

export function useRefresh(): () => Promise<void> {
  const queryClient = useQueryClient();
  const { milestoneInput, tasksInput, childrenCountInput, activitiesInput } = Pages.useLoadedData<LoaderResult>();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.projects.getMilestoneQueryKey(milestoneInput) }),
      queryClient.invalidateQueries({ queryKey: Api.projects.listMilestoneTasksQueryKey(tasksInput) }),
      queryClient.invalidateQueries({ queryKey: Api.projects.countChildrenQueryKey(childrenCountInput) }),
      queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKey(activitiesInput) }),
    ]);
  };
}
