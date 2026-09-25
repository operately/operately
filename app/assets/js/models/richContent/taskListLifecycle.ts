import { useCallback } from "react";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import Api, { type RichTextField, type RichTextResourceType } from "@/api";
import type { TaskItemChange, TaskListInteraction } from "turboui";

export interface TaskListResource {
  resourceType: RichTextResourceType;
  resourceId: string;
  field: RichTextField;
  canEdit: boolean;
}

export function invalidateTaskListQueries(client: QueryClient, type: RichTextResourceType) {
  const templates = [
    Api.project_templates.getQueryKeyPrefix(),
    Api.project_templates.getDiscussionQueryKeyPrefix(),
    Api.project_templates.listCommentsQueryKeyPrefix(),
  ];
  const resources = [Api.resource_hubs.listNodesQueryKeyPrefix()];
  const prefixesByType: Record<RichTextResourceType, ReadonlyArray<readonly unknown[]>> = {
    project: [Api.projects.getQueryKeyPrefix()],
    goal: [Api.goals.getQueryKeyPrefix()],
    task: [
      Api.tasks.getQueryKeyPrefix(),
      Api.tasks.listQueryKeyPrefix(),
      Api.spaces.listTasksQueryKeyPrefix(),
      Api.projects.listMilestoneTasksQueryKeyPrefix(),
    ],
    milestone: [
      Api.projects.getMilestoneQueryKeyPrefix(),
      Api.projects.listMilestonesQueryKeyPrefix(),
      Api.projects.getQueryKeyPrefix(),
    ],
    document: [Api.documents.getQueryKeyPrefix(), Api.documents.listVersionsQueryKeyPrefix(), ...resources],
    file: [Api.files.getQueryKeyPrefix(), ...resources],
    link: [Api.links.getQueryKeyPrefix(), ...resources],
    person: [Api.people.getQueryKeyPrefix(), Api.people.getMeQueryKeyPrefix()],
    kpi: [Api.kpis.getKpiQueryKeyPrefix(), Api.kpis.listKpisQueryKeyPrefix()],
    comment: [
      Api.comments.listQueryKeyPrefix(),
      Api.tasks.getQueryKeyPrefix(),
      Api.projects.getMilestoneQueryKeyPrefix(),
    ],
    space_discussion: [Api.spaces.getDiscussionQueryKeyPrefix(), Api.spaces.listDiscussionsQueryKeyPrefix()],
    project_discussion: [Api.projects.getDiscussionQueryKeyPrefix(), Api.projects.listDiscussionsQueryKeyPrefix()],
    goal_discussion: [Api.goals.listDiscussionsQueryKeyPrefix()],
    project_check_in: [
      Api.projects.getCheckInQueryKeyPrefix(),
      Api.projects.listCheckInsQueryKeyPrefix(),
      Api.projects.getQueryKeyPrefix(),
    ],
    goal_check_in: [
      Api.goals.getCheckInQueryKeyPrefix(),
      Api.goals.listCheckInsQueryKeyPrefix(),
      Api.goals.getQueryKeyPrefix(),
    ],
    project_retrospective: [Api.projects.getRetrospectiveQueryKeyPrefix(), Api.projects.getQueryKeyPrefix()],
    project_template: templates,
    template_task: templates,
    template_milestone: templates,
    template_document: templates,
    template_file: templates,
    template_link: templates,
    template_discussion: templates,
    template_comment: templates,
  };
  const prefixes = [...prefixesByType[type]];
  prefixes.push(Api.companies.listActivitiesQueryKeyPrefix(), Api.companies.getActivityQueryKeyPrefix());
  return Promise.all(prefixes.map((queryKey) => client.invalidateQueries({ queryKey })));
}

export function useSetTaskItemChecked() {
  const client = useQueryClient();
  const { mutateAsync } = useMutation(Api.rich_content.setTaskItemCheckedMutationOptions());

  return useCallback(
    async (resource: Omit<TaskListResource, "canEdit">, change: TaskItemChange) => {
      try {
        await mutateAsync({
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
          field: resource.field,
          itemPath: change.itemPath,
          checked: change.checked,
          expectedContent: JSON.stringify(change.expectedContent),
        });
      } finally {
        await invalidateTaskListQueries(client, resource.resourceType);
      }
    },
    [client, mutateAsync],
  );
}

export function useTaskList(resource: TaskListResource): TaskListInteraction {
  const update = useSetTaskItemChecked();
  return { canEdit: resource.canEdit, onChange: (change) => update(resource, change) };
}
