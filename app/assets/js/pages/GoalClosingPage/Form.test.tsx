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

import { Form } from "./Form";

let mockSubmit: () => Promise<void>;
jest.mock("./loader", () => ({
  useLoadedData: () => ({
    goal: {
      id: "goal-1",
      parentGoalId: "parent2",
      name: "Goal",
      potentialSubscribers: [],
      space: { name: "Space" },
    },
  }),
}));
jest.mock("@/routes/useNavigateTo", () => ({ useNavigateTo: () => mockNavigate }));
jest.mock("@/models/subscriptions", () => ({
  useSubscriptionsAdapter: () => ({
    notifyEveryone: true,
    currentSubscribersList: ["person-1"],
  }),
}));
jest.mock("turboui", () => ({
  emptyContent: () => ({ type: "doc", content: [] }),
  SubscribersSelector: () => null,
  Forms: {
    useForm: (config) => {
      mockSubmit = config.submit;
      return { values: config.fields };
    },
    Form: ({ children }) => children,
    FieldGroup: ({ children }) => children,
    RadioButtons: () => null,
    RichTextArea: () => null,
    Submit: () => null,
  },
}));

it.each([false, true])("closes and refreshes cached views only after success (failure: %s)", async (fails) => {
  if (fails) jest.mocked(axios.post).mockRejectedValue(new Error("Close failed"));
  else jest.mocked(axios.post).mockResolvedValue({ data: { goal: { id: "goal-1" } } });
  const client = new QueryClient();
  const key = Api.goals.getQueryKey({ id: "goal-1" });
  const workMapKey = Api.companies.getWorkMapQueryKey({ spaceId: "space-1" });
  const parentKey = Api.goals.getQueryKey({ id: "parent2" });
  const unrelatedKey = Api.goals.getQueryKey({ id: "other3" });
  [key, workMapKey, parentKey, unrelatedKey].forEach((queryKey) => client.setQueryData(queryKey, {}));
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Form />
        </QueryClientProvider>,
      ),
    );
    await act(async () => {
      if (fails) await expect(mockSubmit()).rejects.toThrow("Close failed");
      else await mockSubmit();
    });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/v2/goals/close",
      expect.objectContaining({
        goal_id: "goal-1",
        success: "yes",
        success_status: "achieved",
        retrospective: JSON.stringify({ type: "doc", content: [] }),
        send_notifications_to_everyone: true,
        subscriber_ids: ["person-1"],
      }),
      expect.anything(),
    );
    expect(client.getQueryState(parentKey)?.isInvalidated).toBe(!fails);
    expect(client.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
    [key, workMapKey].forEach((queryKey) => expect(client.getQueryState(queryKey)?.isInvalidated).toBe(!fails));
    expect(PageCache.invalidate).toHaveBeenCalledTimes(fails ? 0 : 1);
    expect(mockNavigate).toHaveBeenCalledTimes(fails ? 0 : 1);
    if (!fails) expect(PageCache.invalidate).toHaveBeenCalledWith("goal:goal-1");
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
