import axios from "axios";
import { QueryObserver } from "@tanstack/react-query";
import Api from "./index";
import AdminApi from "@/ee/admin_api";
import { queryClient, loaderBackedQueryOptions } from "./queryClient";
import { reportQueryError } from "./queryErrors";
import { handleStaleClientError } from "./staleClient";
import { handleStaleClientError as handleAdminError } from "@/ee/admin_api/staleClient";

jest.mock("axios");
jest.mock("./staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "a" });
  AdminApi.default.setBasePath("/admin/api/v1");
  AdminApi.default.setHeaders({});
});

afterEach(async () => {
  await new Promise((resolve) => setImmediate(resolve));
  queryClient.clear();
});

it("keeps generated main and enterprise query failures silent, but raw GET transport still reports", async () => {
  const error = new Error("request failed");
  jest.mocked(axios.get).mockRejectedValue(error);
  await expect(Api.projects.getQuery({ id: "one" })).rejects.toBe(error);
  await expect(AdminApi.getCompaniesQuery({})).rejects.toBe(error);
  expect(handleStaleClientError).not.toHaveBeenCalled();
  expect(handleAdminError).not.toHaveBeenCalled();
  await expect(Api.default.get("/projects/get", { id: "one" })).rejects.toBe(error);
  await expect(AdminApi.default.get("/get_companies", {})).rejects.toBe(error);
  expect(handleStaleClientError).toHaveBeenCalledWith(error);
  expect(handleAdminError).toHaveBeenCalledWith(error);
});

it("reports a shared pending failure once when an active observer joins the preload", async () => {
  let reject: (reason: unknown) => void = () => {};
  jest.mocked(axios.get).mockImplementationOnce(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  const input = { id: "one" };
  const speculative = Api.projects.getQuery(input).catch(() => undefined);
  const observer = new QueryObserver(queryClient, Api.projects.getQueryOptions(input));
  const unsubscribe = observer.subscribe(() => {});
  const observed = observer.refetch({ throwOnError: true });
  const error = new Error("failed");
  const expectation = expect(observed).rejects.toBe(error);
  reject(error);
  await speculative;
  await expectation;
  unsubscribe();
  reportQueryError(error);
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(handleStaleClientError).toHaveBeenCalledTimes(1);
});

it("reports cached optional failures only when an enabled observer mounts", async () => {
  const error = new Error("optional failed");
  jest.mocked(axios.get).mockRejectedValue(error);
  const input = { id: "one" };
  await Api.projects.getQuery(input).catch(() => undefined);
  const observer = new QueryObserver(queryClient, {
    ...loaderBackedQueryOptions(Api.projects.getQueryOptions(input)),
    enabled: false,
  });
  const unsubscribe = observer.subscribe(() => {});
  expect(handleStaleClientError).not.toHaveBeenCalled();
  observer.setOptions({ ...loaderBackedQueryOptions(Api.projects.getQueryOptions(input)), enabled: true });
  expect(handleStaleClientError).toHaveBeenCalledTimes(1);
  unsubscribe();
});

it("reports normal observed failures while unrelated speculative failures remain silent", async () => {
  jest.mocked(axios.get).mockRejectedValueOnce(new Error("speculative"));
  await Api.projects.getQuery({ id: "one" }).catch(() => undefined);
  const error = new Error("visible");
  jest.mocked(axios.get).mockRejectedValueOnce(error);
  const observer = new QueryObserver(queryClient, Api.projects.getQueryOptions({ id: "two" }));
  const unsubscribe = observer.subscribe(() => {});
  await observer.refetch();
  expect(handleStaleClientError).toHaveBeenCalledTimes(1);
  expect(handleStaleClientError).toHaveBeenCalledWith(error);
  unsubscribe();
});

it("binds the effective cache key and request headers even across company changes", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "one" } } });
  const options = Api.projects.getQueryOptions({ id: "one" });
  Api.default.getHeaders()["x-company-id"] = "b";
  await queryClient.fetchQuery(options);
  expect(axios.get).toHaveBeenLastCalledWith("/api/v2/projects/get", {
    params: { id: "one" },
    headers: { "x-company-id": "a" },
  });
  const scoped = {
    ...options,
    queryKey: [
      options.queryKey[0],
      options.queryKey[1],
      { "x-company-id": "layout" },
      options.queryKey[3],
      options.queryKey[4],
    ] as const,
  };
  await queryClient.fetchQuery(scoped);
  expect(axios.get).toHaveBeenLastCalledWith("/api/v2/projects/get", {
    params: { id: "one" },
    headers: { "x-company-id": "layout" },
  });
});

it("retains mutation transport reporting", async () => {
  const error = new Error("mutation failed");
  jest.mocked(axios.post).mockRejectedValue(error);
  const { mutationFn } = Api.projects.pauseMutationOptions();

  await expect(
    mutationFn?.({ projectId: "one", message: "Paused" }, { client: queryClient, meta: undefined }),
  ).rejects.toBe(error);
  expect(handleStaleClientError).toHaveBeenCalledWith(error);
});

it("keeps sequential requests in matching cache scopes across a company switch and back", async () => {
  let finish: (value: { data: { project: { id: string } } }) => void = () => {};
  jest.mocked(axios.get).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const firstKey = Api.projects.getQueryKey({ id: "one" });
  const loading = Api.projects.getQuery({ id: "one" }).then(() => Api.people.getMeQuery({}));
  Api.default.setHeaders({ "x-company-id": "b" });
  jest.mocked(axios.get).mockResolvedValueOnce({ data: { me: { id: "b-person" } } });
  finish({ data: { project: { id: "a-project" } } });
  await loading;
  expect(queryClient.getQueryData(firstKey)).toEqual({ project: { id: "a-project" } });
  expect(queryClient.getQueryData(Api.people.getMeQueryKey({}))).toEqual({ me: { id: "b-person" } });
  expect(axios.get).toHaveBeenNthCalledWith(2, "/api/v2/people/get_me", {
    params: {},
    headers: { "x-company-id": "b" },
  });
  Api.default.setHeaders({ "x-company-id": "a" });
  expect(queryClient.getQueryData(Api.people.getMeQueryKey({}))).toBeUndefined();
  await Api.projects.getQuery({ id: "one" });
  expect(axios.get).toHaveBeenCalledTimes(2);
});
