import Api from "@/api";
import { legacyLoader } from "./legacyLoader";

jest.mock("@/api", () => ({ __esModule: true, default: { spaces: { getQuery: jest.fn() } } }));
jest.mock("turboui", () => ({}));

const params = { companyId: "acme", id: "marketing-space" };

it.each(["", "?taskId=task-1"])("redirects the legacy URL to the default board, preserving %s", async (suffix) => {
  jest.mocked(Api.spaces.getQuery).mockResolvedValue({
    space: { __typename: "space", id: "marketing-space", name: "Marketing", defaultTaskBoardId: "board-1" },
  });

  const response = await legacyLoader({
    params,
    request: new Request(`https://app.test/acme/spaces/marketing-space/kanban${suffix}`),
  });

  expect(Api.spaces.getQuery).toHaveBeenCalledWith({ id: "marketing-space" });
  expect(response.headers.get("Location")).toBe(`/acme/spaces/marketing-space/boards/board-1${suffix}`);
  expect(response.headers.get("X-Remix-Replace")).toBe("true");
});

it("returns not found when the space has no default board", async () => {
  jest.mocked(Api.spaces.getQuery).mockResolvedValue({
    space: { __typename: "space", id: "marketing-space", name: "Marketing", defaultTaskBoardId: null },
  });

  await expect(
    legacyLoader({ params, request: new Request("https://app.test/acme/spaces/marketing-space/kanban") }),
  ).rejects.toMatchObject({ status: 404 });
});

it("preserves access errors", async () => {
  const error = { status: 403 };
  jest.mocked(Api.spaces.getQuery).mockRejectedValue(error);

  await expect(
    legacyLoader({ params, request: new Request("https://app.test/acme/spaces/marketing-space/kanban") }),
  ).rejects.toBe(error);
});
