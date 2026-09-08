import Api, { Person } from "@/api";
import { QueryClient, QueryObserver, onlineManager } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { companyPeopleQueryOptions } from "./useCompanyPeople";

jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

const person: Person = {
  __typename: "person",
  id: "person-1",
  fullName: "Alex Rivera",
  title: "Engineer",
  avatarUrl: null,
  email: "alex@example.com",
  type: "member",
};
const people = { people: [person] };
let client: QueryClient;
let get: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  onlineManager.setOnline(true);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  client.mount();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  get = jest.spyOn(axios, "get");
});

afterEach(() => {
  client.unmount();
  client.clear();
  onlineManager.setOnline(true);
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test("recovers from a transient network failure", async () => {
  get.mockRejectedValueOnce(new AxiosError("Network Error", "ERR_NETWORK")).mockResolvedValue({ data: people });

  const request = client.fetchQuery(companyPeopleQueryOptions());
  await jest.advanceTimersByTimeAsync(4_000);

  await expect(request).resolves.toEqual(people);
  expect(get).toHaveBeenCalledTimes(2);
});

test("stops after two network retries", async () => {
  const error = new AxiosError("Network Error", "ERR_NETWORK");
  get.mockRejectedValue(error);

  const request = client.fetchQuery(companyPeopleQueryOptions()).catch((failure) => failure);
  await jest.advanceTimersByTimeAsync(10_000);

  expect(await request).toBe(error);
  expect(get).toHaveBeenCalledTimes(3);
});

test.each([401, 403, 404, 500])("does not retry HTTP %s responses", async (status) => {
  const error = new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "Error",
    data: {},
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
  });
  get.mockRejectedValue(error);

  await expect(client.fetchQuery(companyPeopleQueryOptions())).rejects.toBe(error);
  expect(get).toHaveBeenCalledTimes(1);
});

test("preserves cached people when a background refresh fails", async () => {
  const options = companyPeopleQueryOptions();
  client.setQueryData(options.queryKey, people);
  get.mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));

  const request = client.fetchQuery(options).catch(() => undefined);
  await jest.advanceTimersByTimeAsync(10_000);
  await request;

  expect(client.getQueryData(options.queryKey)).toEqual(people);
  expect(client.getQueryState(options.queryKey)?.status).toBe("error");
});

test("waits for connectivity before fetching people", async () => {
  onlineManager.setOnline(false);
  get.mockResolvedValue({ data: people });
  const request = client.fetchQuery(companyPeopleQueryOptions());
  await jest.advanceTimersByTimeAsync(0);

  expect(get).not.toHaveBeenCalled();
  onlineManager.setOnline(true);
  await jest.advanceTimersByTimeAsync(0);
  await expect(request).resolves.toEqual(people);
});

test("recovers an exhausted network failure after reconnecting", async () => {
  get.mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));
  const observer = new QueryObserver(client, companyPeopleQueryOptions());
  const unsubscribe = observer.subscribe(() => {});
  await jest.advanceTimersByTimeAsync(10_000);
  expect(observer.getCurrentResult().isError).toBe(true);
  expect(get).toHaveBeenCalledTimes(3);

  onlineManager.setOnline(false);
  get.mockResolvedValue({ data: people });
  onlineManager.setOnline(true);
  await jest.advanceTimersByTimeAsync(0);

  expect(get).toHaveBeenCalledTimes(4);
  expect(observer.getCurrentResult().data).toEqual(people);
  unsubscribe();
});

test("keeps people caches separate for different companies", async () => {
  get.mockResolvedValueOnce({ data: people }).mockResolvedValueOnce({ data: { people: [] } });
  const firstCompany = companyPeopleQueryOptions();
  await client.fetchQuery(firstCompany);
  Api.default.setHeaders({ "x-company-id": "company-2" });
  const secondCompany = companyPeopleQueryOptions();
  await client.fetchQuery(secondCompany);

  expect(client.getQueryData(firstCompany.queryKey)).toEqual(people);
  expect(client.getQueryData(secondCompany.queryKey)).toEqual({ people: [] });
});
