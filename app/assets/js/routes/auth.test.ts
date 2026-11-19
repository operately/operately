/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api, { Company, Space } from "@/api";
import { registerApplicationTeardown, teardownApplication } from "@/applicationTeardown";
import { companyLayoutInputs, useCompanyLayoutQueries } from "@/models/companies/companyLayoutQueries";
import { useLoadedData } from "@/pages/SpaceWorkMapPage/loader";
import { queryClient } from "@/api/queryClient";
import { logIn, logOut, logOutAndRedirect } from "./auth";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({
  useLoadedData: () => ({
    workMapInput: { spaceId: "space-1" },
    spaceInput: { id: "space-1", includeAccessLevels: true, includePermissions: true },
    templatesInput: { archiveStatus: "active" },
    editableSpacesInput: { query: "", accessLevel: "edit_access" },
  }),
}));

describe("authentication cache isolation", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    queryClient.clear();
    queryClient.setQueryData(["company-layout", "previous-account"], { company: "private" });
    jest.spyOn(queryClient, "clear");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    queryClient.clear();
  });

  it("clears cached queries after a successful login", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 200 } as Response);

    await expect(logIn("user@example.com", "password", { skipRedirect: true })).resolves.toBe("success");

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("clears cached queries after a successful logout", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 200 } as Response);

    await expect(logOut()).resolves.toBe("success");

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("preserves cached queries when authentication fails", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 401 } as Response);

    await expect(logIn("user@example.com", "wrong password", { skipRedirect: true })).resolves.toBe("failure");
    await expect(logOut()).resolves.toBe("failure");

    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["company-layout", "previous-account"])).toEqual({ company: "private" });
  });

  it.each([200, 401])("redirects to home only after successful logout (HTTP %s)", async (status) => {
    const location = window.location;
    const redirect = jest.fn();
    Reflect.deleteProperty(window, "location");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        set href(url: string) {
          redirect(url);
        },
      },
    });
    const teardown = jest.fn();
    registerApplicationTeardown(teardown);
    jest.mocked(global.fetch).mockResolvedValue({ status } as Response);
    try {
      await logOutAndRedirect();
      expect(global.fetch).toHaveBeenCalledWith("/accounts/log_out", expect.objectContaining({ method: "DELETE" }));
      if (status === 200) {
        expect(teardown).toHaveBeenCalledTimes(1);
        expect(redirect).toHaveBeenCalledWith("/");
        const clearOrder = jest.mocked(queryClient.clear).mock.invocationCallOrder[0] ?? 0;
        expect(teardown.mock.invocationCallOrder[0]).toBeLessThan(clearOrder);
        expect(clearOrder).toBeLessThan(redirect.mock.invocationCallOrder[0] ?? 0);
      } else {
        expect(teardown).not.toHaveBeenCalled();
        expect(redirect).not.toHaveBeenCalled();
      }
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: location });
      teardownApplication();
    }
  });
});

describe("pending requests during authentication", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ status: 200 });
    queryClient.clear();
  });
  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  it.each(["login", "logout"])("does not cache late responses after %s", async (action) => {
    let finish: (value: string) => void = () => {};
    const oldRequest = queryClient
      .fetchQuery({
        queryKey: ["person"],
        queryFn: () =>
          new Promise<string>((resolve) => {
            finish = resolve;
          }),
      })
      .catch(() => undefined);
    if (action === "login") await logIn("new@example.com", "password", { skipRedirect: true });
    else await logOut();
    queryClient.setQueryData(["person"], "new session");
    finish("previous session");
    await oldRequest;
    expect(queryClient.getQueryData(["person"])).toBe("new session");
  });

  it("keeps sequential recovery in the new session without restoring a cancelled response", async () => {
    let finish: (value: string) => void = () => {};
    const first = queryClient.fetchQuery({
      queryKey: ["first"],
      queryFn: () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    });
    const recovery = first.catch(() =>
      queryClient.fetchQuery({ queryKey: ["recovery"], queryFn: async () => "current session" }),
    );
    await logIn("new@example.com", "password", { skipRedirect: true });
    finish("old session");
    await recovery;
    expect(queryClient.getQueryData(["first"])).toBeUndefined();
    expect(queryClient.getQueryData(["recovery"])).toBe("current session");
  });
});

describe("logout of the mounted application", () => {
  let root: Root;
  let container: HTMLDivElement;
  let rerender: () => void;
  let teardown: jest.Mock;
  const errors: Error[] = [];
  const company: Company = { __typename: "company", id: "company-1", name: "Acme", setupCompleted: true };
  const space: Space = { __typename: "space", id: "space-1", name: "Engineering" };

  class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
      return { failed: true };
    }
    componentDidCatch(error: Error) {
      errors.push(error);
    }
    render() {
      return this.state.failed ? null : this.props.children;
    }
  }

  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    global.fetch = jest.fn();
    jest.mocked(axios.get).mockImplementation(() => new Promise(() => {}));
    jest.spyOn(console, "error").mockImplementation(() => {});
    queryClient.clear();
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": company.id });
    window.appConfig = { ...window.appConfig, billingEnabled: false };
    const inputs = companyLayoutInputs();
    queryClient.setQueryData(Api.companies.getQueryKey(inputs.companyInput), { company });
    queryClient.setQueryData(Api.spaces.countByAccessLevelQueryKey(inputs.spacesInput), { count: 1 });
    queryClient.setQueryData(Api.site_messages.listActiveQueryKey({}), { messages: [] });
    queryClient.setQueryData(Api.companies.getWorkMapQueryKey({ spaceId: space.id }), { workMap: [] });
    queryClient.setQueryData(
      Api.spaces.getQueryKey({ id: space.id, includeAccessLevels: true, includePermissions: true }),
      { space },
    );
    queryClient.getMutationCache().build(queryClient, { mutationKey: ["previous-account"] });
    errors.length = 0;
    container = document.createElement("div");
    root = createRoot(container);
    teardown = jest.fn(() => root.unmount());
    registerApplicationTeardown(teardown);

    function OutgoingApplication() {
      const [renderCount, setRenderCount] = React.useState(0);
      rerender = () => setRenderCount((count) => count + 1);
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(ErrorBoundary, null, React.createElement(CompanyObserver, { renderCount })),
        React.createElement(ErrorBoundary, null, React.createElement(WorkMapObserver, { renderCount })),
      );
    }
    function CompanyObserver({ renderCount }: { renderCount: number }) {
      const loaded = useCompanyLayoutQueries(inputs);
      return React.createElement("span", { "data-company": loaded.company.id, "data-render": renderCount });
    }
    function WorkMapObserver({ renderCount }: { renderCount: number }) {
      const loaded = useLoadedData();
      return React.createElement("span", { "data-space": loaded.data.space.id, "data-render": renderCount });
    }
    await act(async () => {
      root.render(
        React.createElement(QueryClientProvider, { client: queryClient }, React.createElement(OutgoingApplication)),
      );
    });
    expect(container.querySelector("[data-company]")?.getAttribute("data-company")).toBe(company.id);
    expect(container.querySelector("[data-space]")?.getAttribute("data-space")).toBe(space.id);
  });

  afterEach(async () => {
    await act(async () => teardownApplication());
    await act(async () => root.unmount());
    jest.restoreAllMocks();
    queryClient.clear();
  });

  it("detaches required-data observers before clearing cache during the redirect interval", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 200 } as Response);
    const clear = queryClient.clear.bind(queryClient);
    jest.spyOn(queryClient, "clear").mockImplementation(() => {
      // Force the old UI to render after clearing, before any document unload.
      clear();
      rerender();
    });

    await act(async () => {
      expect(await logOut()).toBe("success");
    });

    expect(errors).toEqual([]);
    expect(teardown).toHaveBeenCalledTimes(1);
    expect(container.childNodes).toHaveLength(0);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it("preserves the mounted interface and cache when logout fails", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ status: 401 } as Response);
    await act(async () => {
      expect(await logOut()).toBe("failure");
      rerender();
    });

    expect(teardown).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
    expect(container.querySelector("[data-space]")?.getAttribute("data-render")).toBe("1");
    expect(container.querySelector("[data-company]")?.getAttribute("data-render")).toBe("1");
    expect(queryClient.getQueryData(Api.companies.getQueryKey(companyLayoutInputs().companyInput))).toEqual({
      company,
    });
    expect(queryClient.getMutationCache().getAll()).toHaveLength(1);
  });
});
