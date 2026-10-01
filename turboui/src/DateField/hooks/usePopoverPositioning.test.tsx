import React from "react";
import { render, screen } from "@testing-library/react";
import { EmbeddingProvider } from "../../Embedding";
import { usePopoverPositioning } from "./usePopoverPositioning";

function Positioning() {
  const { triggerRef, side } = usePopoverPositioning({ open: true });
  return <div ref={triggerRef} data-testid="trigger" data-side={side} />;
}

afterEach(() => jest.restoreAllMocks());

test("unembedded date pickers use space above a trigger near the bottom of the window", () => {
  // DOMRect coordinates are inherited accessors, not enumerable own properties.
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue(Object.create({ left: 20, top: 600, width: 100, height: 30, right: 120, bottom: 630 }));
  render(<Positioning />);
  expect(screen.getByTestId("trigger").getAttribute("data-side")).toBe("top");
});

test("embedded date pickers use the unscaled preview bounds", () => {
  const container = document.createElement("div");
  Object.defineProperties(container, {
    clientWidth: { value: 1100 },
    clientHeight: { value: 900 },
    offsetWidth: { value: 1100 },
  });
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue(Object.create({ left: 110, top: 400, width: 50, height: 15 }));
  container.getBoundingClientRect = jest
    .fn()
    .mockReturnValue(Object.create({ left: 100, top: 100, width: 550, height: 450 }));
  render(
    <EmbeddingProvider portalContainer={container} scrollContainer={container}>
      <Positioning />
    </EmbeddingProvider>,
  );
  expect(screen.getByTestId("trigger").getAttribute("data-side")).toBe("top");
});
