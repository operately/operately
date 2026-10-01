import React from "react";
import { act, render, screen } from "@testing-library/react";
import { EmbeddingProvider } from "../Embedding";
import { useWindowSizeBreakpoints } from "./useWindowSizeBreakpoint";

function Breakpoint() {
  return <output data-testid="breakpoint">{useWindowSizeBreakpoints()}</output>;
}

test("without ResizeObserver, embedded breakpoints still initialize and respond to window resizing", () => {
  const original = global.ResizeObserver;
  Object.defineProperty(global, "ResizeObserver", { value: undefined, configurable: true, writable: true });
  const container = document.createElement("div");
  let width = 1100;
  Object.defineProperty(container, "clientWidth", { get: () => width });
  try {
    const view = render(
      <EmbeddingProvider portalContainer={container} scrollContainer={container}>
        <Breakpoint />
      </EmbeddingProvider>,
    );
    expect(screen.getByTestId("breakpoint").textContent).toBe("lg");
    act(() => {
      width = 480;
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByTestId("breakpoint").textContent).toBe("xs");
    view.unmount();
  } finally {
    global.ResizeObserver = original;
  }
});
