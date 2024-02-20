import * as Pages from "@/components/Pages";
import * as Tasks from "@/models/tasks";

interface LoaderResult {
  task: Tasks.Task;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    task: await Tasks.getTask(params.id, {
      includeProject: true,
      includeMilestone: true,
      includeAssignees: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
