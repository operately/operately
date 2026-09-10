/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import page from "./index";

jest.mock("axios");
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn(), Page: ({ children }) => children }));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }) => children,
  Body: ({ children }) => children,
}));
jest.mock("turboui", () => ({
  SecondaryButton: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

it("renders fetched markdown and copies exactly the displayed content", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  const markdown = "# Goal\n\nProgress: 50%";
  jest.mocked(axios.get).mockResolvedValue({ data: { markdown } });
  const inputs = await page.loader({
    params: { id: "goal-1" },
    request: { url: "https://operately.test/goals/goal-1/md" },
  });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  const container = document.createElement("div");
  const root = createRoot(container);
  jest.useFakeTimers();
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <page.Page />
        </QueryClientProvider>,
      ),
    );
    expect(container.querySelector("code")?.textContent).toBe(markdown);
    await act(async () => container.querySelector("button")?.click());
    expect(writeText).toHaveBeenCalledWith(markdown);
    expect(container.querySelector("button")?.textContent).toBe("Copied!");
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(container.querySelector("button")?.textContent).toBe("Copy to clipboard");
  } finally {
    await act(async () => root.unmount());
    queryClient.clear();
    jest.useRealTimers();
  }
});
