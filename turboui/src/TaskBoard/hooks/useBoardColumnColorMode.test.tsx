import { act, renderHook } from "@testing-library/react";
import { useBoardColumnColorMode } from "./useBoardColumnColorMode";

beforeEach(() => window.localStorage.clear());
afterEach(() => jest.restoreAllMocks());

it("defaults to soft for missing or unsupported preferences", () => {
  expect(renderHook(useBoardColumnColorMode).result.current[0]).toBe("soft");
  window.localStorage.setItem("board:columnColors", "invalid");
  expect(renderHook(useBoardColumnColorMode).result.current[0]).toBe("soft");
});

it("keeps the preference usable when browser storage is disabled", () => {
  jest.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("Unavailable", "SecurityError");
  });
  const { result } = renderHook(useBoardColumnColorMode);
  expect(result.current[0]).toBe("soft");
  act(() => result.current[1]("vivid"));
  expect(result.current[0]).toBe("vivid");
});

it("keeps the selected mode when storage writes fail", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  const { result } = renderHook(useBoardColumnColorMode);
  act(() => result.current[1]("bordered"));
  expect(result.current[0]).toBe("bordered");
});
