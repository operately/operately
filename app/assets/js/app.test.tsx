/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createMemoryRouter } from "react-router";
import { queryClient } from "@/api/queryClient";
import { logOut } from "@/routes/auth";
import { teardownApplication } from "@/applicationTeardown";
import { createAppRoutes } from "./routes";

jest.mock("./routes", () => ({ createAppRoutes: jest.fn() }));
jest.mock("@/signals", () => ({ init: jest.fn() }));
jest.mock("@/analytics", () => ({ startAnalytics: jest.fn() }));
jest.mock("@/api/socket", () => ({}));
jest.mock("./i18n", () => ({}));
jest.mock("turboui", () => ({ ToasterBar: () => null }));
jest.mock("@/contexts/ThemeContext", () => ({ ThemeProvider: ({ children }) => children }));

it("bootstrap detaches the root and disposes routing before logout clears session data", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.appConfig = { ...window.appConfig, sentry: { enabled: false, dsn: "" }, billingEnabled: false };
  global.fetch = jest.fn().mockResolvedValue({ status: 200 });
  const container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
  const cachedSession = { company: "private" };
  queryClient.setQueryData(["session"], cachedSession);
  const cleanup = jest.fn(() => {
    expect(queryClient.getQueryData(["session"])).toEqual(cachedSession);
  });
  function Page() {
    React.useEffect(() => cleanup, []);
    return <span data-test-id="outgoing-application" />;
  }
  const router = createMemoryRouter([{ path: "/", element: <Page /> }]);
  jest.mocked(createAppRoutes).mockReturnValue(router);
  const dispose = jest.spyOn(router, "dispose");

  try {
    await act(async () => {
      require("./app");
    });
    expect(container.querySelector("[data-test-id=outgoing-application]")).not.toBeNull();
    // StrictMode runs an initial effect cleanup; only inspect the logout cleanup.
    cleanup.mockClear();
    jest.mocked(global.fetch).mockResolvedValueOnce({ status: 401 } as Response);
    await act(async () => {
      expect(await logOut()).toBe("failure");
    });
    expect(cleanup).not.toHaveBeenCalled();
    expect(dispose).not.toHaveBeenCalled();
    expect(container.querySelector("[data-test-id=outgoing-application]")).not.toBeNull();
    expect(queryClient.getQueryData(["session"])).toEqual(cachedSession);

    await act(async () => {
      expect(await logOut()).toBe("success");
    });
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(container.childNodes).toHaveLength(0);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  } finally {
    await act(async () => teardownApplication());
    container.remove();
    queryClient.clear();
    jest.restoreAllMocks();
  }
});
