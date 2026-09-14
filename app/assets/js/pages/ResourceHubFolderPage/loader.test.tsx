import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { loader } from "./loader";

jest.mock("axios");
jest.mock("turboui", () => ({}));

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  queryClient.clear();
  jest.clearAllMocks();
  jest.mocked(axios.get).mockImplementation(async (path) => ({
    data: path.endsWith("/get_folder")
      ? { folder: { id: "folder-1", resourceHub: { id: "hub-1" } } }
      : path.endsWith("/get")
        ? { resourceHub: { id: "hub-1" } }
        : { nodes: [], draftNodes: [{ id: "draft-in-another-folder" }] },
  }));
});
afterEach(() => queryClient.clear());

it("loads and reuses the hub-wide draft query", async () => {
  const params = { id: "folder-1" };
  const inputs = await loader({ params });
  expect(inputs.draftsInput).toEqual({ resourceHubId: "hub-1" });
  const drafts = queryClient.getQueryData(Api.resource_hubs.listDraftsQueryKey(inputs.draftsInput));
  expect(drafts).toEqual({ nodes: [], draftNodes: [{ id: "draft-in-another-folder" }] });
  await loader({ params });
  expect(jest.mocked(axios.get).mock.calls.filter(([path]) => path.endsWith("/list_drafts"))).toHaveLength(1);
});

it("propagates draft-query failure instead of showing zero drafts", async () => {
  const error = new Error("Drafts unavailable");
  const respond = jest.mocked(axios.get).getMockImplementation();
  if (!respond) throw new Error("Missing API mock");
  jest.mocked(axios.get).mockImplementation((path, config) => {
    if (path.endsWith("/list_drafts")) return Promise.reject(error);
    return respond(path, config);
  });
  await expect(loader({ params: { id: "folder-1" } })).rejects.toBe(error);
});
