/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { showErrorToast } from "turboui";
import Api, { type GoalCheck } from "@/api";
import { act, renderHook } from "@/__tests__/renderHook";
import { useChecklists } from "./useChecklists";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
let client: QueryClient;
const check = (id: string, index = 0): GoalCheck => ({
  __typename: "goal_check",
  id,
  name: id,
  index,
  completed: false,
  insertedAt: "",
  updatedAt: "",
});
beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  client = new QueryClient();
  jest.resetAllMocks();
  Object.defineProperty(globalThis.crypto, "randomUUID", { configurable: true, value: jest.fn(() => "temporary-id") });
});
afterEach(() => client.clear());
const setup = (items = [check("one"), check("two", 1)]) =>
  renderHook(useChecklists, {
    initialProps: { goalId: "goal1", initialChecklist: items },
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });

it("replaces a temporary item and toggles it using the saved ID", async () => {
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
  let toggling: Promise<boolean>;
  act(() => {
    adding = result.current.add({ name: "New" });
  });
  const temporary = result.current.items[0];
  if (!temporary) throw new Error("Missing optimistic item");
  act(() => {
    toggling = result.current.toggle(temporary.id, true);
  });
  await act(async () => {
    finish({ data: { check_id: "saved", success: true } });
    await adding;
    expect(await toggling).toBe(true);
  });
  expect(result.current.items).toMatchObject([{ id: "saved", completed: true }]);
  expect(jest.mocked(axios.post).mock.calls.at(-1)?.[1]).toMatchObject({ check_id: "saved" });
});

it("sorts and reorders immutably and rolls back unsuccessful saves", async () => {
  const original = [check("two", 1), check("one")];
  const { result } = setup(original);
  expect(original.map((item) => item.id)).toEqual(["two", "one"]);
  expect(result.current.items.map((item) => item.id)).toEqual(["one", "two"]);
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
  await act(async () => {
    await result.current.updateIndex("two", 0);
  });
  expect(result.current.items.map((item) => [item.id, item.index])).toEqual([
    ["two", 0],
    ["one", 1],
  ]);
  expect(original[0]?.index).toBe(1);
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: false } });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => {
      expect(await result.current.update({ itemId: "one", name: "Failed" })).toBe(false);
    });
    expect(result.current.items.find((item) => item.id === "one")?.name).toBe("one");
  } finally {
    log.mockRestore();
  }
});

it("reconciles server changes after local edits and resets on goal navigation", async () => {
  const { result, rerender } = setup();
  jest.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } });
  await act(async () => {
    await result.current.toggle("one", true);
  });
  rerender({ goalId: "goal1", initialChecklist: [{ ...check("one"), name: "Server", completed: true }] });
  expect(result.current.items).toMatchObject([{ name: "Server", completed: true }]);
  rerender({ goalId: "goal2", initialChecklist: [check("other")] });
  expect(result.current.items.map((item) => item.id)).toEqual(["other"]);
});

it.each(["edit", "toggle", "reorder", "delete"])(
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
      adding = result.current.add({ name: "New" });
    });
    const temporary = result.current.items.at(-1);
    if (!temporary) throw new Error("Missing optimistic item");
    act(() => {
      switch (operation) {
        case "edit":
          dependent = result.current.update({ itemId: temporary.id, name: "Edited" });
          break;
        case "toggle":
          dependent = result.current.toggle(temporary.id, true);
          break;
        case "reorder":
          dependent = result.current.updateIndex(temporary.id, 0);
          break;
        default:
          dependent = result.current.delete(temporary.id);
      }
      unrelated = result.current.update({ itemId: "one", name: "Updated" });
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
      expect(jest.mocked(axios.post).mock.calls[1]?.[0]).toContain("/goals/update_check");
      expect(showErrorToast).toHaveBeenCalledTimes(1);
      expect(result.current.items).toMatchObject([{ id: "one", name: "Updated" }, { id: "two" }]);
    } finally {
      log.mockRestore();
    }
  },
);
