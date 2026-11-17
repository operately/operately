import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateToolManagementQueries } from "./useSpaceToolManagement";
jest.mock("turboui", () => ({}));

it("invalidates discovery, cards, default projections and task permissions without invalidating unrelated data", async () => {
  Api.default.setBasePath("/api/v2");
  const client = new QueryClient();
  const keys = [
    Api.spaces.getQueryKey({ id: "space" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space" }),
    Api.tasks.listBoardsQueryKey({ spaceId: "space", archiveStatus: "all" }),
    Api.tasks.getBoardQueryKey({ spaceId: "space", boardId: "board" }),
    Api.tasks.listQueryKey({ spaceId: "space", boardId: "board" }),
    Api.resource_hubs.listQueryKey({ spaceId: "space" }),
  ];
  const unrelated = ["unrelated"];
  [...keys, unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateToolManagementQueries(client);
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
});
