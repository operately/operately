import Api, { Space, Task } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const spaceInput = { id: params.id, includePermissions: true };
  const tasksInput = { spaceId: params.id };

  await Promise.all([Api.spaces.getQuery(spaceInput), Api.spaces.listTasksQuery(tasksInput)]);

  return { spaceInput, tasksInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { space: Space; tasks: Task[] } {
  const { spaceInput, tasksInput } = Pages.useLoadedData<LoaderResult>();
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const { data: tasksData } = useLoadedQuery(Api.spaces.listTasksQueryOptions(tasksInput));

  if (!spaceData?.space || !tasksData) {
    throw new Error(`Space Kanban data is unavailable for space "${spaceInput.id}"`);
  }

  return { space: spaceData.space, tasks: tasksData.tasks };
}

export function useRefresh(): () => Promise<void> {
  const queryClient = useQueryClient();
  const { spaceInput, tasksInput } = Pages.useLoadedData<LoaderResult>();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.spaces.getQueryKey(spaceInput) }),
      queryClient.invalidateQueries({ queryKey: Api.spaces.listTasksQueryKey(tasksInput) }),
    ]);
  };
}
