/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useLoadedData } from "./loader";
import { AckCTA } from "./AckCTA";

const mockAcknowledge = jest.fn();

jest.mock("react-router", () => ({}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: jest.fn() }));
jest.mock("./loader", () => ({ useLoadedData: jest.fn(), useRefresh: () => jest.fn() }));
jest.mock("@/components/Pages", () => ({ useIsViewMode: () => true }));
jest.mock("@/models/goalCheckIns", () => ({
  useAcknowledgeGoalProgressUpdate: () => ({ mutateAsync: mockAcknowledge }),
}));
jest.mock("turboui", () => ({
  PrimaryButton: ({ testId, onClick }: { testId: string; onClick: () => void }) => (
    <button data-test-id={testId} onClick={onClick} />
  ),
}));

describe("GoalCheckInPage acknowledgement", () => {
  let root: Root;
  let container: HTMLDivElement;
  let data: ReturnType<typeof useLoadedData>;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    window.history.replaceState({}, "", "/");

    container = document.createElement("div");
    root = createRoot(container);

    data = {
      goal: { id: "goal", champion: { id: "champion" }, reviewer: { id: "reviewer" } },
      update: {
        __typename: "goal_progress_update",
        id: "check-in",
        state: "published",
        permissions: { canAcknowledge: true },
        acknowledgedAt: null,
      },
    } as ReturnType<typeof useLoadedData>;

    jest.mocked(useLoadedData).mockImplementation(() => data);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
  });

  async function renderAs(id: string | null) {
    jest.mocked(useMe).mockReturnValue(id ? ({ id } as ReturnType<typeof useMe>) : null);
    await act(async () => root.render(<AckCTA />));
  }

  it.each(["champion", "reviewer"])("allows the %s to acknowledge", async (id) => {
    await renderAs(id);

    const button = container.querySelector<HTMLButtonElement>('[data-test-id="acknowledge-check-in"]');
    expect(button).not.toBeNull();

    await act(async () => button?.click());

    expect(mockAcknowledge).toHaveBeenCalledTimes(1);
  });

  it.each(["editor", null])("hides the action for %s despite backend permission", async (id) => {
    await renderAs(id);

    expect(container.innerHTML).toBe("");
    expect(mockAcknowledge).not.toHaveBeenCalled();
  });

  it("hides the action when backend permission is denied, including authors and read-only users", async () => {
    data.update.permissions = { canAcknowledge: false } as typeof data.update.permissions;

    await renderAs("champion");

    expect(container.innerHTML).toBe("");
  });

  it("hides an already acknowledged post", async () => {
    data.update.acknowledgedAt = "2026-09-10T12:00:00Z";

    await renderAs("reviewer");

    expect(container.innerHTML).toBe("");
  });

  it("allows the champion when no reviewer is assigned", async () => {
    data.goal.reviewer = null;

    await renderAs("champion");

    expect(container.querySelector("button")).not.toBeNull();
  });

  it.each(["champion", "reviewer", "editor"])(
    "applies the role restriction to automatic acknowledgement for %s",
    async (id) => {
      window.history.replaceState({}, "", "/?acknowledge=true");

      await renderAs(id);

      expect(container.innerHTML).toBe("");
      expect(mockAcknowledge).toHaveBeenCalledTimes(id === "editor" ? 0 : 1);
    },
  );
});
