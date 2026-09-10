/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "./useForm";
const mockCreate = jest.fn();
const mockNavigate = jest.fn();
let mockSubmit: () => Promise<void>;
jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("@/routes/paths", () => ({ usePaths: () => ({ goalActivityPath: (id) => `/activities/${id}` }) }));
jest.mock("@/models/goals", () => ({ useCreateGoalDiscussion: () => ({ mutateAsync: mockCreate }) }));
jest.mock("turboui", () => ({
  emptyContent: () => ({}),
  Forms: {
    useForm: (options) => {
      mockSubmit = options.submit;
      return { values: { title: "Discussion", message: { type: "doc" } } };
    },
  },
}));

it("preserves notifications and navigates only after success", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  function Harness() {
    useForm({
      goal: { id: "goal1" },
      subscriptionsState: { notifyEveryone: false, currentSubscribersList: ["person1"] },
    } as Parameters<typeof useForm>[0]);
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () => root.render(<Harness />));
    mockCreate.mockRejectedValueOnce(new Error("failed"));
    await act(async () => {
      await expect(mockSubmit()).rejects.toThrow("failed");
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    mockCreate.mockResolvedValueOnce({ activityId: "activity1" });
    await act(async () => {
      await mockSubmit();
    });
    expect(mockCreate).toHaveBeenLastCalledWith({
      goalId: "goal1",
      title: "Discussion",
      message: '{"type":"doc"}',
      sendNotificationsToEveryone: false,
      subscriberIds: ["person1"],
    });
    expect(mockNavigate).toHaveBeenCalledWith("/activities/activity1");
  } finally {
    await act(async () => root.unmount());
  }
});
