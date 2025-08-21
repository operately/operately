import * as Pages from "@/components/Pages";
import * as Tasks from "@/models/tasks";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  task: Tasks.Task;
}

export async function loader({ params }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId });
  await redirectIfFeatureEnabled(params, { feature: "task_v2", path: paths.taskV2Path(params.id) });

  return {
    task: await Tasks.getTask({
      id: params.id,
      includeProject: true,
      includeMilestone: true,
      includeAssignees: true,
    }).then((d) => d.task!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
