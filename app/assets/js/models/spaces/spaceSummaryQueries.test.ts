import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateSpaceSummaryQueries } from "./spaceSummaryQueries";

jest.mock("turboui", () => ({}));
jest.mock("react-router", () => ({}));

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

it("invalidates affected summary URL variants and preserves unrelated queries", async () => {
  const client = new QueryClient();
  const affected = ["space1", "renamed-space1"].map((spaceId) => Api.spaces.listToolsQueryKey({ spaceId }));
  const unrelated = [Api.spaces.listToolsQueryKey({ spaceId: "space2" }), Api.spaces.getQueryKey({ id: "space1" })];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));

  try {
    await invalidateSpaceSummaryQueries(client, ["old-space1"]);

    affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  } finally {
    client.clear();
  }
});
