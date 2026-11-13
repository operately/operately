import Api, { Space, Task, TaskBoard } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const spaceInput = { id: params.id, includePermissions: true };
  const boardInput = { spaceId: params.id, boardId: params.boardId };
  const tasksInput = boardInput;

  await Promise.all([
    Api.spaces.getQuery(spaceInput),
    Api.tasks.getBoardQuery(boardInput),
    Api.tasks.listQuery(tasksInput),
  ]);

  return { spaceInput, boardInput, tasksInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { space: Space; board: TaskBoard; tasks: Task[] } {
  const { spaceInput, boardInput, tasksInput } = Pages.useLoadedData<LoaderResult>();
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const { data: boardData } = useLoadedQuery(Api.tasks.getBoardQueryOptions(boardInput));
  const { data: tasksData } = useLoadedQuery(Api.tasks.listQueryOptions(tasksInput));

  if (!spaceData?.space || !boardData || !tasksData) {
    throw new Error(`Space Kanban data is unavailable for space "${spaceInput.id}"`);
  }

  return { space: spaceData.space, board: boardData.board, tasks: tasksData.tasks };
}

export function useRefresh(): () => Promise<void> {
  const queryClient = useQueryClient();
  const { spaceInput, boardInput, tasksInput } = Pages.useLoadedData<LoaderResult>();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.spaces.getQueryKey(spaceInput) }),
      queryClient.invalidateQueries({ queryKey: Api.tasks.listQueryKey(tasksInput) }),
      queryClient.invalidateQueries({ queryKey: Api.tasks.getBoardQueryKey(boardInput) }),
    ]);
  };
}
