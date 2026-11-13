import Api from "@/api";
import { invalidateResourceHubQueries } from "@/models/resourceHubs/resourceHubLifecycle";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ToolAction } from "turboui";

export async function invalidateToolManagementQueries(client: QueryClient) {
  await Promise.all(
    [
      Api.spaces.getQueryKeyPrefix(),
      Api.spaces.listToolsQueryKeyPrefix(),
      Api.tasks.listQueryKeyPrefix(),
      Api.tasks.listBoardsQueryKeyPrefix(),
      Api.tasks.getBoardQueryKeyPrefix(),
      Api.resource_hubs.listQueryKeyPrefix(),
      Api.tasks.getQueryKeyPrefix(),
    ].map((queryKey) => client.invalidateQueries({ queryKey })),
  );
}

export function useSpaceToolManagement(spaceId: string) {
  const client = useQueryClient();
  const createHub = useMutation(Api.resource_hubs.createMutationOptions());
  const renameHub = useMutation(Api.resource_hubs.renameMutationOptions());
  const reorderHubs = useMutation(Api.resource_hubs.reorderMutationOptions());
  const deleteHub = useMutation(Api.resource_hubs.deleteMutationOptions());
  const createBoard = useMutation(Api.tasks.createBoardMutationOptions());
  const renameBoard = useMutation(Api.tasks.renameBoardMutationOptions());
  const reorderBoards = useMutation(Api.tasks.reorderBoardsMutationOptions());
  const archiveBoard = useMutation(Api.tasks.archiveBoardMutationOptions());
  const restoreBoard = useMutation(Api.tasks.restoreBoardMutationOptions());
  const setDefaultBoard = useMutation(Api.tasks.setDefaultBoardMutationOptions());

  const execute = async (action: ToolAction) => {
    if (action.kind === "hub") {
      switch (action.type) {
        case "create":
          return createHub.mutateAsync({ spaceId, name: action.name });
        case "rename":
          return renameHub.mutateAsync({ resourceHubId: action.id, newName: action.name });
        case "reorder":
          return reorderHubs.mutateAsync({ spaceId, resourceHubIds: action.ids });
        case "delete":
          return deleteHub.mutateAsync({ resourceHubId: action.id });
      }
    } else {
      switch (action.type) {
        case "create":
          return createBoard.mutateAsync({ spaceId, name: action.name });
        case "rename":
          return renameBoard.mutateAsync({ boardId: action.id, newName: action.name });
        case "reorder":
          return reorderBoards.mutateAsync({ spaceId, boardIds: action.ids });
        case "archive":
          return archiveBoard.mutateAsync({ spaceId, boardId: action.id });
        case "restore":
          return restoreBoard.mutateAsync({ spaceId, boardId: action.id });
        case "setDefault":
          return setDefaultBoard.mutateAsync({ spaceId, boardId: action.id });
      }
    }
  };

  return {
    mutateAsync: async (action: ToolAction) => {
      await execute(action);
      await Promise.all([
        invalidateToolManagementQueries(client),
        action.kind === "hub" && "id" in action
          ? invalidateResourceHubQueries(
              client,
              {
                resourceHubId: action.id,
                renamedCollection: action.type === "rename",
                deleted: action.type === "delete",
              },
              { spaceId },
            )
          : Promise.resolve(),
      ]);
    },
  };
}
