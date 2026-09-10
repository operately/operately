/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "./useForm";

const mockPost = jest.fn();
const mockEdit = jest.fn();
const mockNavigate = jest.fn();
const mockSetMode = jest.fn();

let mockScheduled = false;
let mockSubmit: (action?: string) => Promise<void>;
let mockValues: any;

jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("@/components/Pages", () => ({ useSetPageMode: () => mockSetMode }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ goalPath: (id) => `/goals/${id}`, goalCheckInPath: (id) => `/check-ins/${id}` }),
}));
jest.mock("@/models/goalCheckIns", () => ({
  usePostGoalProgressUpdate: () => ({ mutateAsync: mockPost }),
  useEditGoalProgressUpdate: () => ({ mutateAsync: mockEdit }),
}));
jest.mock("@/hooks/useScheduleFlow", () => ({
  useScheduleFlow: () => ({ isScheduledLocally: mockScheduled, scheduledAtIso: "2026-10-10T12:00:00Z" }),
}));
jest.mock("turboui", () => ({
  emptyContent: () => ({ type: "doc" }),
  Forms: {
    useForm: (options) => {
      mockSubmit = options.submit;
      mockValues = { ...options.fields, status: "on_track" };
      return { values: mockValues };
    },
  },
}));

const goal = { id: "goal1", targets: [], checklist: [] };

async function withForm(props: any, run: () => Promise<void>) {
  function Harness() {
    useForm(props);

    return null;
  }

  const root = createRoot(document.createElement("div"));

  try {
    await act(async () => root.render(<Harness />));
    await act(run);
  } finally {
    await act(async () => root.unmount());
  }
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  mockScheduled = false;
  mockPost.mockResolvedValue({ update: { id: "check1" } });
  mockEdit.mockResolvedValue({});
});

it.each([
  ["submit", false],
  ["save-draft", false],
  ["schedule", true],
  ["submit", true],
] as const)("preserves creation payload for %s (scheduled: %s)", async (action, scheduled) => {
  mockScheduled = scheduled;

  await withForm(
    { mode: "new", goal, subscriptionsState: { notifyEveryone: false, currentSubscribersList: ["person1"] } },
    async () => {
      await mockSubmit(action);

      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: "goal1",
          status: "on_track",
          postAsDraft: action === "save-draft",
          subscriberIds: ["person1"],
          sendNotificationsToEveryone: false,
          scheduledAt: scheduled ? "2026-10-10T12:00:00Z" : undefined,
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/check-ins/check1");
    },
  );
});

it.each([
  ["draft", "publish-draft", false, "published", undefined],
  ["draft", "publish-draft", true, "scheduled", "2026-10-10T12:00:00Z"],
  ["scheduled", "save-changes", true, "scheduled", "2026-10-10T12:00:00Z"],
  ["scheduled", "publish-now", false, "published", null],
  ["scheduled", "save-as-draft", false, "draft", null],
  ["draft", "save-draft", false, "draft", null],
  ["published", "submit", false, undefined, undefined],
])("preserves %s → %s", async (initialState, action, scheduled, state, scheduledAt) => {
  mockScheduled = scheduled as boolean;

  await withForm({ mode: "edit", goal, update: { id: "check1", state: initialState, message: "{}" } }, async () => {
    await mockSubmit(action as string);

    expect(mockEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "check1", state, scheduledAt }));
    expect(mockSetMode).toHaveBeenCalledWith("view");
  });
});

it.each(["new", "edit"])("keeps the %s form and draft on failed submission", async (mode) => {
  mockPost.mockRejectedValue(new Error("failed"));
  mockEdit.mockRejectedValue(new Error("failed"));

  await withForm(
    { mode, goal, subscriptionsState: {}, update: { id: "check1", state: "draft", message: "{}" } },
    async () => {
      const values = mockValues;

      await expect(mockSubmit()).rejects.toThrow("failed");

      expect(mockValues).toBe(values);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetMode).not.toHaveBeenCalled();
    },
  );
});

it("waits for the save and invalidation before leaving edit mode", async () => {
  let finish: (value: unknown) => void = () => {};
  mockEdit.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );

  await withForm({ mode: "edit", goal, update: { id: "check1", state: "published", message: "{}" } }, async () => {
    const saving = mockSubmit();

    expect(mockSetMode).not.toHaveBeenCalled();

    finish({});
    await saving;

    expect(mockSetMode).toHaveBeenCalledWith("view");
  });
});
