import axios from "axios";
import Api from "./index";
import { queryClient } from "./queryClient";

jest.mock("axios");

describe("queryClient", () => {
  beforeEach(() => {
    queryClient.clear();
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    jest.mocked(axios.get).mockReset();
  });

  it("uses stale-while-revalidate defaults without retrying failed requests", () => {
    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: false,
    });
  });

  it("deduplicates and caches opt-in generated queries by their complete input", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1", includeSpace: true };

    await Promise.all([Api.projects.getQuery(input), Api.projects.getQuery(input)]);
    await Api.projects.getQuery({ ...input });

    expect(axios.get).toHaveBeenCalledTimes(1);

    await Api.projects.getQuery({ ...input, includeSpace: false });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("keeps existing endpoint functions uncached", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1" };

    await Api.projects.get(input);
    await Api.projects.get(input);

    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
