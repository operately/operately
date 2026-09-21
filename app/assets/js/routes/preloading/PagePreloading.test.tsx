/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { PagePreloading } from "./PagePreloading";
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
