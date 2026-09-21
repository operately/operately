/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { PagePreloading, usePredictivePreloading } from "./PagePreloading";
import { renderHook } from "@/__tests__/renderHook";
import { createPagePreloader } from "./preloadPage";

jest.mock("./preloadPage", () => ({ createPagePreloader: jest.fn() }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Router = React.ComponentProps<typeof PagePreloading>["router"];

it("cancels on router navigation and cleans up subscriptions and document listeners", () => {
  jest.useFakeTimers();
  const service = {
    preloadPage: jest.fn(async () => {}),
    isEligible: () => true,
    scope: () => "company",
    hasPending: () => false,
    subscribeToCompletion: () => () => {},
    dispose: jest.fn(),
  };
  jest.mocked(createPagePreloader).mockReturnValue(service);

  let onNavigation = (_state: Router["state"]) => {};
  const unsubscribe = jest.fn();
  const router: Router = {
    routes: [],
    state: { location: { pathname: "/company", search: "" }, navigation: { state: "idle" } },
    subscribe: (callback: typeof onNavigation) => {
      onNavigation = callback;
      return unsubscribe;
    },
  };

  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(<PagePreloading router={router} />));

  const anchor = document.createElement("a");
  anchor.href = "/company/project";
  document.body.append(anchor);

  anchor.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
  onNavigation({ ...router.state, navigation: { state: "loading" } });
  jest.advanceTimersByTime(150);

  expect(service.preloadPage).not.toHaveBeenCalled();

  anchor.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
  act(() => root.unmount());

  anchor.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
  jest.advanceTimersByTime(150);

  expect(service.preloadPage).not.toHaveBeenCalled();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  expect(service.dispose).toHaveBeenCalledTimes(1);

  container.remove();
  anchor.remove();
  jest.useRealTimers();
});

it("discards predictive work as soon as navigation starts, including in StrictMode", async () => {
  jest.useFakeTimers();
  let finish = () => {};
  const service = {
    preloadPage: jest.fn(
      (_href: string) =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    ),
    isEligible: () => true,
    scope: () => "company",
    hasPending: () => false,
    subscribeToCompletion: () => () => {},
    dispose: jest.fn(),
  };
  jest.mocked(createPagePreloader).mockReturnValue(service);

  let onNavigation = (_state: Router["state"]) => {};
  const router: Router = {
    routes: [],
    state: { location: { pathname: "/company", search: "" }, navigation: { state: "idle" } },
    subscribe: (callback: typeof onNavigation) => {
      onNavigation = callback;
      return () => {};
    },
  };
  const root = createRoot(document.createElement("div"));
  act(() =>
    root.render(
      <React.StrictMode>
        <PagePreloading router={router}>
          <Home />
        </PagePreloading>
      </React.StrictMode>,
    ),
  );
  await act(() => jest.advanceTimersByTimeAsync(0));
  expect(service.preloadPage).toHaveBeenCalledWith("/map");

  onNavigation({ ...router.state, navigation: { state: "loading" } });
  finish();
  await act(() => jest.advanceTimersByTimeAsync(0));
  expect(service.preloadPage).toHaveBeenCalledTimes(1);

  act(() => root.unmount());
  jest.useRealTimers();
});

function Home() {
  usePredictivePreloading(["/map", "/space"]);
  return null;
}

it("keeps the queue on equivalent URLs and drops it on destination changes and unmount", async () => {
  jest.useFakeTimers();
  const service = {
    preloadPage: jest.fn(async (_href: string) => {}),
    isEligible: () => true,
    scope: () => "company",
    hasPending: () => false,
    subscribeToCompletion: () => () => {},
    dispose: jest.fn(),
  };
  jest.mocked(createPagePreloader).mockReturnValue(service);
  const router: Router = {
    routes: [],
    state: { location: { pathname: "/company", search: "" }, navigation: { state: "idle" } },
    subscribe: () => () => {},
  };
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <PagePreloading router={router}>{children}</PagePreloading>
  );
  const hook = renderHook(usePredictivePreloading, { initialProps: ["/one", "/two"], wrapper });
  await act(() => jest.advanceTimersByTimeAsync(0));

  hook.rerender(["/one", "/two"]);
  await act(() => jest.advanceTimersByTimeAsync(0));
  expect(service.preloadPage.mock.calls).toEqual([["/one"], ["/two"]]);

  hook.rerender(["/three"]);
  hook.rerender(["/four"]);
  await act(() => jest.advanceTimersByTimeAsync(0));
  expect(service.preloadPage.mock.calls).toEqual([["/one"], ["/two"], ["/four"]]);

  hook.rerender(["/five"]);
  hook.unmount();
  await act(() => jest.advanceTimersByTimeAsync(0));
  expect(service.preloadPage).toHaveBeenCalledTimes(3);
  jest.useRealTimers();
});
