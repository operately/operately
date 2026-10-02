/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Header } from "./Header";

jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function classTokens(element: Element | null | undefined) {
  return new Set(element?.className.split(/\s+/).filter(Boolean));
}

it("keeps centered header actions at their natural width on mobile", () => {
  act(() =>
    root.render(
      <Header
        title="Discussions"
        layout="title-center-actions-left"
        actions={<button type="button">New discussion</button>}
      />,
    ),
  );

  const actions = container.querySelector("button")?.parentElement;
  const tokens = classTokens(actions);

  expect(tokens.has("shrink-0")).toBe(true);
  expect(tokens.has("whitespace-nowrap")).toBe(true);
  expect(tokens.has("w-[30%]")).toBe(false);
  expect(tokens.has("sm:w-[30%]")).toBe(true);
});

it("keeps title-left header actions from shrinking", () => {
  act(() => root.render(<Header title="Team & Access" actions={<button type="button">Add Members</button>} />));

  const actions = container.querySelector("button")?.parentElement;
  expect(classTokens(actions).has("shrink-0")).toBe(true);
});
