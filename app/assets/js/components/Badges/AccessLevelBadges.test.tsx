/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { applyLanguage } from "@/i18n";
import { SpaceAccessLevelBadge, GoalAccessLevelBadge } from "./AccessLevelBadges";

// App and TurboUI have separate dependency directories; share React in this integration test.
jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../turboui/node_modules/react-dom", () => jest.requireActual("react-dom"));
jest.mock("turboui", () => jest.requireActual("../../../../../turboui/src/Tooltip"));

const originalResizeObserver = globalThis.ResizeObserver;

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

beforeEach(async () => {
  await applyLanguage("en");
  jest.useFakeTimers();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => jest.useRealTimers());

describe.each([
  ["space", SpaceAccessLevelBadge],
  ["goal", GoalAccessLevelBadge],
] as const)("%s access badge", (_resource, Badge) => {
  test.each(["hover", "focus"])("opens its tooltip on %s", async (interaction) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(<Badge accessLevel={100} />);
      });
      const badge = container.firstElementChild;
      if (!(badge instanceof HTMLElement)) throw new Error("Access badge was not rendered");

      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      await act(async () => {
        if (interaction === "focus") {
          badge.focus();
        } else {
          badge.dispatchEvent(
            Object.assign(new MouseEvent("pointermove", { bubbles: true }), { pointerType: "mouse" }),
          );
        }
      });
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.textContent).toBeTruthy();
      expect(badge.getAttribute("aria-describedby")).toBe(tooltip?.id);
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
