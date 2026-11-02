import React from "react";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router";
import { useScrollIntoViewOnLoad } from "./useScrollIntoViewOnLoad";

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  document.body.replaceChildren();
});

function setup() {
  const comment = document.createElement("div");
  comment.id = "regular-comment";
  comment.scrollIntoView = jest.fn();
  document.body.appendChild(comment);

  const hook = renderHook(
    () => {
      useScrollIntoViewOnLoad(comment.id);
      return useNavigate();
    },
    {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={["/documents/doc-1#regular-comment"]}>{children}</MemoryRouter>
      ),
    },
  );

  return { ...hook, scroll: comment.scrollIntoView };
}

test("selecting a new inline thread does not scroll back to the regular comment", () => {
  const { result, scroll } = setup();
  act(() => jest.advanceTimersByTime(500));
  expect(scroll).toHaveBeenCalledTimes(1);

  act(() => {
    result.current("/documents/doc-1?inlineThread=new-thread#regular-comment", {
      replace: true,
      preventScrollReset: true,
    });
  });
  act(() => jest.advanceTimersByTime(500));

  expect(scroll).toHaveBeenCalledTimes(1);
});

test("cancels a stale hash scroll and still scrolls when navigating to the comment again", () => {
  const { result, scroll } = setup();
  act(() => result.current("/documents/doc-1#another-comment"));
  act(() => jest.advanceTimersByTime(500));
  expect(scroll).not.toHaveBeenCalled();

  act(() => result.current("/documents/doc-1#regular-comment"));
  act(() => jest.advanceTimersByTime(500));
  expect(scroll).toHaveBeenCalledTimes(1);

  act(() => result.current("/documents/doc-2#regular-comment"));
  act(() => jest.advanceTimersByTime(500));
  expect(scroll).toHaveBeenCalledTimes(2);
});

test("cancels pending scrolling on unmount", () => {
  const { unmount, scroll } = setup();
  unmount();
  act(() => jest.advanceTimersByTime(500));
  expect(scroll).not.toHaveBeenCalled();
});
