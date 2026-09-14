/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { showErrorToast } from "turboui";
import Api from "@/api";
import { act, renderHook } from "@/__tests__/renderHook";
import { useGoalTargets } from "./useGoalTargets";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
let client: QueryClient;
const target = (id: string, index = 0) => ({
  id,
  index,
  name: id,
  from: 0,
  to: 10,
  value: 0,
  unit: "items",
  mode: "view" as const,
});
beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  client = new QueryClient();
  jest.resetAllMocks();
  Object.defineProperty(globalThis.crypto, "randomUUID", { configurable: true, value: jest.fn(() => "temporary-id") });
});
afterEach(() => client.clear());
const setup = (targets = [target("one"), target("two", 1)]) =>
  renderHook(useGoalTargets, {
    initialProps: { goalId: "goal1", initialTargets: targets },
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });

it("replaces temporary IDs and sends queued edits with the saved ID", async () => {
  const { result } = setup([]);
  let finish = (_result: unknown) => {};
  jest
    .mocked(axios.post)
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    )
    .mockResolvedValueOnce({ data: { success: true } });
  let adding: Promise<unknown>;
  let editing: Promise<boolean>;
  act(() => {
    adding = result.current.addTarget({ name: "New", startValue: 0, targetValue: 10, unit: "items" });
  });
  const temporary = result.current.targets[0];
  if (!temporary) throw new Error("Missing optimistic target");
  act(() => {
    editing = result.current.updateTargetValue(temporary.id, 5);
  });
  await act(async () => {
    finish({ data: { target_id: "saved", success: true } });
    await adding;
    expect(await editing).toBe(true);
  });
  expect(result.current.targets).toMatchObject([{ id: "saved", value: 5 }]);
  expect(jest.mocked(axios.post).mock.calls.at(-1)?.[1]).toMatchObject({ target_id: "saved", value: 5 });
});

it("normalizes ordering without mutating input, and rolls back failed saves", async () => {
  const original = [target("one"), target("two", 1)];
  const { result } = setup(original);
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
  await act(async () => {
    expect(await result.current.updateTargetIndex("two", 0)).toBe(true);
  });
  expect(result.current.targets.map((item) => [item.id, item.index])).toEqual([
    ["two", 0],
    ["one", 1],
  ]);
  expect(original.map((item) => [item.id, item.index])).toEqual([
    ["one", 0],
    ["two", 1],
  ]);
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: false } });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => {
      expect(await result.current.deleteTarget("one")).toBe(false);
    });
    expect(result.current.targets.map((item) => item.id)).toEqual(["two", "one"]);
  } finally {
    log.mockRestore();
  }
});

it("accepts server changes after edits and resets when visiting another goal", async () => {
  const { result, rerender } = setup();
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
  await act(async () => {
    await result.current.updateTargetValue("one", 4);
  });
  rerender({ goalId: "goal1", initialTargets: [{ ...target("one"), value: 7 }] });
  expect(result.current.targets[0]?.value).toBe(7);
  rerender({ goalId: "goal2", initialTargets: [target("other")] });
  expect(result.current.targets.map((item) => item.id)).toEqual(["other"]);
});

it.each(["edit", "value", "reorder", "delete"])(
  "cancels a queued %s after creation fails and continues unrelated saves",
  async (operation) => {
    const { result } = setup();
    let finish = (_result: unknown) => {};
    jest
      .mocked(axios.post)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValue({ data: { success: true } });
    let adding: Promise<unknown>;
    let dependent: Promise<boolean>;
    let unrelated: Promise<boolean>;
    act(() => {
      adding = result.current.addTarget({ name: "New", startValue: 0, targetValue: 10, unit: "items" });
    });
    const temporary = result.current.targets.at(-1);
    if (!temporary) throw new Error("Missing optimistic item");
    act(() => {
      switch (operation) {
        case "edit":
          dependent = result.current.updateTarget({
            targetId: temporary.id,
            name: "Edited",
            startValue: 0,
            targetValue: 10,
            unit: "items",
          });
          break;
        case "value":
          dependent = result.current.updateTargetValue(temporary.id, 5);
          break;
        case "reorder":
          dependent = result.current.updateTargetIndex(temporary.id, 0);
          break;
        default:
          dependent = result.current.deleteTarget(temporary.id);
      }
      unrelated = result.current.updateTargetValue("one", 7);
    });
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () => {
        finish({ data: { success: false } });
        expect(await adding).toMatchObject({ success: false });
        expect(await dependent).toBe(false);
        expect(await unrelated).toBe(true);
      });
      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(jest.mocked(axios.post).mock.calls[1]?.[0]).toContain("/goals/update_target_value");
      expect(showErrorToast).toHaveBeenCalledTimes(1);
      expect(result.current.targets).toMatchObject([{ id: "one", value: 7 }, { id: "two" }]);
    } finally {
      log.mockRestore();
    }
  },
);
