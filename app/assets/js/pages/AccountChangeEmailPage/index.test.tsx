/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { waitFor } from "@/__tests__/renderHook";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { EmailChangeState } from "@/api";
import type { AccountChangeEmailPage } from "turboui";
import PageModule from "./index";

const mockRenderedSteps: string[] = [];
let mockProps: AccountChangeEmailPage.Props;

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ homePath: () => "/", accountSecurityPath: () => "/account/security" }),
}));
jest.mock("react-router", () => ({ useNavigate: () => jest.fn() }));
jest.mock("turboui", () => ({
  AccountChangeEmailPage: (props: AccountChangeEmailPage.Props) => {
    const step = props.completedEmail ? "success" : props.state.pending ? "verify" : "enter-email";
    mockRenderedSteps.push(step);
    mockProps = props;
    return null;
  },
}));

const pendingState: EmailChangeState = {
  __typename: "email_change_state",
  currentEmail: "old@example.com",
  pending: {
    __typename: "email_change_request",
    id: "request",
    email: "new@example.com",
    expiresAt: "2099-01-01T00:00:00Z",
    attemptsRemaining: 5,
  },
  retryAfter: 0,
};
const completedState: EmailChangeState = { ...pendingState, currentEmail: "new@example.com", pending: null };

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  mockRenderedSteps.length = 0;
  window.appConfig = { ...window.appConfig, allowLoginWithEmail: true, allowLoginWithGoogle: true };
});
afterEach(() => jest.restoreAllMocks());

test("confirmation goes directly to success while account and profile queries refresh", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const queryOptions = Api.email_changes.getQueryOptions({});
  const key = queryOptions.queryKey;
  client.setQueryData(key, () => ({ state: pendingState }));
  let finishRefresh: (result: { state: EmailChangeState }) => void = () => {};
  const refresh = new Promise<{ state: EmailChangeState }>((resolve) => {
    finishRefresh = resolve;
  });
  const refetch = jest.fn(() => refresh);
  jest.spyOn(Api.email_changes, "getQueryOptions").mockReturnValue({ ...queryOptions, queryFn: refetch });
  jest.spyOn(Api.email_changes, "confirmMutationOptions").mockReturnValue({
    mutationFn: async () => ({ outcome: "success", state: completedState }),
  });
  const root = createRoot(document.createElement("div"));
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <PageModule.Page />
      </QueryClientProvider>,
    ),
  );

  expect(mockProps.state.pending?.id).toBe("request");
  let confirmation: Promise<boolean> | undefined;
  await act(async () => {
    confirmation = mockProps.onConfirm("request", "ABC123");
  });
  await waitFor(() => expect(refetch).toHaveBeenCalled());

  try {
    expect(mockProps.completedEmail).toBe("new@example.com");
    expect(mockRenderedSteps).not.toContain("enter-email");
  } finally {
    await act(async () => {
      finishRefresh({ state: completedState });
      await confirmation;
    });
    await act(async () => root.unmount());
    client.clear();
  }
});

test("an invalid code keeps verification visible and never shows success", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const queryOptions = Api.email_changes.getQueryOptions({});
  const key = queryOptions.queryKey;
  client.setQueryData(key, () => ({ state: pendingState }));
  const refetch = jest.fn(async () => ({ state: pendingState }));
  jest.spyOn(Api.email_changes, "getQueryOptions").mockReturnValue({ ...queryOptions, queryFn: refetch });
  jest.spyOn(Api.email_changes, "confirmMutationOptions").mockReturnValue({
    mutationFn: async () => ({ outcome: "invalid_code", state: pendingState }),
  });
  const root = createRoot(document.createElement("div"));
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <PageModule.Page />
      </QueryClientProvider>,
    ),
  );

  try {
    await act(async () => {
      await mockProps.onConfirm("request", "ABC123");
    });
    expect(mockProps.error).not.toBeNull();
    expect(mockProps.state.pending?.id).toBe("request");
    expect(mockProps.completedEmail).toBeNull();
    expect(mockRenderedSteps).not.toContain("success");
    expect(mockRenderedSteps).not.toContain("enter-email");
    expect(refetch).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
