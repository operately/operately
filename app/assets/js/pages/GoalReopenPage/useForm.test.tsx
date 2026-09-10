/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { PageCache } from "@/routes/PageCache";

const mockNavigate = jest.fn();
jest.mock("axios");
jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("@/routes/paths", () => ({
  compareIds: jest.requireActual("@/routes/paths").compareIds,
  usePaths: () => ({ goalPath: (id) => `/goals/${id}` }),
}));
jest.mock("@/routes/PageCache", () => ({ PageCache: { invalidate: jest.fn() } }));
jest.mock("@/pages/GoalPage", () => ({ pageCacheKey: (id) => `goal:${id}` }));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: jest.fn() }));

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  jest.clearAllMocks();
});

import { Goal } from "@/api";
import { SubscriptionsState } from "@/models/subscriptions";
import { useForm, FormState } from "./useForm";

const mockClearDraft = jest.fn();
jest.mock("turboui", () => ({
  useEditor: () => ({
    editor: { getJSON: () => ({ type: "doc", content: [] }) },
    clearLocalDraft: mockClearDraft,
  }),
}));

it.each([false, true])("reopens and clears the draft only after success (failure: %s)", async (fails) => {
  if (fails) jest.mocked(axios.post).mockRejectedValue(new Error("Reopen failed"));
  else jest.mocked(axios.post).mockResolvedValue({ data: { goal: { id: "goal-1" } } });
  const client = new QueryClient();
  const key = Api.companies.getWorkMapQueryKey({});
  const activityKey = Api.companies.getActivityQueryKey({ id: "activity-1" });
  const parentKey = Api.goals.getQueryKey({ id: "parent2" });
  const unrelatedKey = Api.goals.getQueryKey({ id: "other3" });
  [key, parentKey, unrelatedKey].forEach((queryKey) => client.setQueryData(queryKey, {}));
  client.setQueryData(activityKey, { activity: { content: { goal: { id: "goal-1" } } } });
  let form: FormState | undefined;
  function Harness() {
    form = useForm(
      { id: "goal-1", parentGoalId: "parent2" } as Goal,
      {
        notifyEveryone: false,
        currentSubscribersList: ["person-1"],
      } as SubscriptionsState,
    );
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
    await act(async () => {
      if (!form) throw new Error("Form not rendered");
      if (fails) await expect(form.submit()).rejects.toThrow("Reopen failed");
      else await form.submit();
    });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/v2/goals/reopen",
      expect.objectContaining({
        id: "goal-1",
        message: JSON.stringify({ type: "doc", content: [] }),
        send_notifications_to_everyone: false,
        subscriber_ids: ["person-1"],
      }),
      expect.anything(),
    );
    expect(client.getQueryState(parentKey)?.isInvalidated).toBe(!fails);
    expect(client.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
    [key, activityKey].forEach((queryKey) => expect(client.getQueryState(queryKey)?.isInvalidated).toBe(!fails));
    expect(PageCache.invalidate).toHaveBeenCalledTimes(fails ? 0 : 1);
    expect(mockClearDraft).toHaveBeenCalledTimes(fails ? 0 : 1);
    expect(mockNavigate).toHaveBeenCalledTimes(fails ? 0 : 1);
    if (!fails) {
      expect(PageCache.invalidate).toHaveBeenCalledWith("goal:goal-1");
      expect(mockNavigate).toHaveBeenCalledWith("/goals/goal-1");
    }
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
