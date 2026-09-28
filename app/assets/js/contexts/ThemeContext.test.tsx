/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useUpdateTheme } from "@/models/people/themeLifecycle";
import { ThemeProvider, useSetTheme, useTheme } from "./ThemeContext";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("react-router", () => ({}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

let client: QueryClient;
let systemDark: boolean;
let listeners: Set<(event: { matches: boolean }) => void>;

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={client}>
    <ThemeProvider>{children}</ThemeProvider>
  </QueryClientProvider>
);

function mountTheme() {
  return renderHook(() => ({ theme: useTheme(), setTheme: useSetTheme(), update: useUpdateTheme() }), {
    initialProps: undefined,
    wrapper,
  });
}

function changeSystemMode(dark: boolean) {
  act(() => {
    systemDark = dark;
    listeners.forEach((listener) => listener({ matches: dark }));
  });
}

function expectColorMode(mode: "dark" | "light") {
  expect(document.documentElement.classList.contains(mode)).toBe(true);
  expect(document.documentElement.classList.contains(mode === "dark" ? "light" : "dark")).toBe(false);
}

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  systemDark = false;
  listeners = new Set();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => ({
      matches: systemDark,
      addEventListener: (_event: string, listener: (event: { matches: boolean }) => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: (event: { matches: boolean }) => void) =>
        listeners.delete(listener),
    })),
  });
});
afterEach(() => client.clear());

it("uses the system mode while loading, then applies the account theme", async () => {
  let finish = (_value: unknown) => {};
  jest.mocked(axios.get).mockImplementation(() => new Promise((resolve) => (finish = resolve)));
  const { result } = mountTheme();
  expect(result.current.theme).toBe("system");
  expectColorMode("light");
  await act(async () => finish({ data: { theme: "dark" } }));
  await waitFor(() => expect(result.current.theme).toBe("dark"));
  expectColorMode("dark");
});

it.each(["failure", "missing"])(
  "defaults to the system theme when query data is unavailable (%s)",
  async (scenario) => {
    if (scenario === "failure") jest.mocked(axios.get).mockRejectedValue(new Error("Unavailable"));
    else jest.mocked(axios.get).mockResolvedValue({ data: {} });
    const { result } = mountTheme();
    await waitFor(() => expect(client.getQueryState(Api.getThemeQueryKey({}))?.fetchStatus).toBe("idle"));
    expect(result.current.theme).toBe("system");
    expectColorMode("light");
    changeSystemMode(true);
    expectColorMode("dark");
  },
);

it("follows system changes only in system mode and removes its listener on unmount", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { theme: "system" } });
  const { result, unmount } = mountTheme();
  await waitFor(() => expect(client.getQueryState(Api.getThemeQueryKey({}))?.status).toBe("success"));
  changeSystemMode(true);
  expectColorMode("dark");
  act(() => result.current.setTheme("light"));
  changeSystemMode(true);
  expectColorMode("light");
  act(() => result.current.setTheme("system"));
  expectColorMode("dark");
  unmount();
  expect(listeners.size).toBe(0);
});

it("previews changes immediately and preserves the saved theme across remounts", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { theme: "dark" } });
  const { result, unmount } = mountTheme();
  await waitFor(() => expect(result.current.theme).toBe("dark"));
  act(() => result.current.setTheme("light"));
  expectColorMode("light");
  expect(axios.post).not.toHaveBeenCalled();
  jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
  await act(() => result.current.update.mutateAsync({ theme: "light" }));
  unmount();
  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  const remounted = mountTheme();
  expect(remounted.result.current.theme).toBe("light");
  await waitFor(() => expect(client.getQueryState(Api.getThemeQueryKey({}))?.status).toBe("error"));
  expectColorMode("light");
});

it("keeps the preview after a failed save so the user can retry", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { theme: "dark" } });
  const { result } = mountTheme();
  await waitFor(() => expect(result.current.theme).toBe("dark"));
  act(() => result.current.setTheme("light"));
  jest.mocked(axios.post).mockRejectedValue(new Error("Failed"));
  await act(async () => {
    await expect(result.current.update.mutateAsync({ theme: "light" })).rejects.toThrow("Failed");
  });
  expectColorMode("light");
  expect(client.getQueryData(Api.getThemeQueryKey({}))).toEqual({ theme: "dark" });
});
