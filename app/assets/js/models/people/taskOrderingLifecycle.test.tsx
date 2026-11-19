/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useUpdateTaskOrdering } from "./taskOrderingLifecycle";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

test.each([true, false])("updates optimistically and reconciles after success=%s", async (success) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const key = Api.people.getTaskOrderingQueryKey({});
  const unrelated = Api.companies.getFlatWorkMapQueryKey({});
  client.setQueryData(key, { taskIds: ["a", "b"] });
  client.setQueryData(unrelated, { workMap: [] });
  let resolve: (value: unknown) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  jest.mocked(axios.post).mockImplementation(
    () =>
      new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      }),
  );
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = renderHook(useUpdateTaskOrdering, { initialProps: undefined, wrapper });
  let save: Promise<void> = Promise.resolve();
  let failure: unknown;
  act(() => {
    save = result.current.save(["b", "a"]).catch((error) => {
      failure = error;
    });
  });
  await waitFor(() => expect(client.getQueryData(key)).toEqual({ taskIds: ["b", "a"] }));
  expect(result.current.isPending).toBe(true);
  // A rapid second interaction cannot race the first save or its rollback.
  await act(() => result.current.save(["a", "b"]));
  expect(axios.post).toHaveBeenCalledTimes(1);
  await act(async () => {
    if (success) resolve({ data: { taskIds: ["b", "a"] } });
    else reject(new Error("Offline"));
    await save;
  });
  expect(client.getQueryData(key)).toEqual({ taskIds: success ? ["b", "a"] : ["a", "b"] });
  expect(Boolean(failure)).toBe(!success);
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  await waitFor(() => expect(result.current.isPending).toBe(false));
  unmount();
  client.clear();
});
