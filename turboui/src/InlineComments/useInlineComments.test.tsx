import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import type { InlineThread } from "../ApiTypes";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { useInlineComments } from "./useInlineComments";
import type { DocumentInlineCommentsProps } from "./types";

jest.mock("./SelectionAction", () => ({
  SelectionAction: ({ onAdd }) => (
    <button data-test-id="inline-add-selection" onClick={onAdd}>
      Add comment
    </button>
  ),
}));
jest.mock("./FloatingComments", () => ({
  FloatingComments: ({ items }) => (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.content}</div>
      ))}
    </div>
  ),
}));
beforeEach(() => {
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});
afterEach(() => jest.restoreAllMocks());
jest.mock("../CommentSection", () => ({
  CommentItem: () => null,
  CommentInput: ({ form, submitDisabled, onCancel, initiallyActive }) => {
    const [text, setText] = React.useState("");
    const [active, setActive] = React.useState(Boolean(initiallyActive));
    if (!active) return <button onClick={() => setActive(true)}>Write a reply</button>;
    return (
      <div>
        <textarea aria-label="Comment draft" value={text} onChange={(e) => setText(e.target.value)} />
        <button disabled={submitDisabled} onClick={() => form.postComment({ type: "text", text })}>
          Submit
        </button>
        <button onClick={onCancel}>Cancel draft</button>
      </div>
    );
  },
}));

const thread: InlineThread = {
  __typename: "inline_thread",
  id: "one",
  resourceType: "resource_hub_document",
  resourceId: "doc",
  author: null,
  resolvedAt: null,
  resolvedBy: null,
  insertedAt: "2026-10-29T12:00:00Z",
  messages: [],
  anchor: {
    __typename: "inline_anchor",
    sourceVersion: 1,
    sourceFrom: 1,
    sourceTo: 6,
    quote: "Hello",
    prefix: "",
    suffix: " world",
    currentVersion: 1,
    currentFrom: 1,
    currentTo: 6,
    status: "attached",
  },
};
function props(overrides: Partial<DocumentInlineCommentsProps> = {}): DocumentInlineCommentsProps {
  return {
    documentVersion: 1,
    threads: [thread],
    currentUser: { id: "me", fullName: "Maya", avatarUrl: null, profileLink: "#" },
    canComment: true,
    activeThreadId: null,
    loading: false,
    error: false,
    draftKey: "test",
    richTextHandlers: { mentionedPersonLookup: async () => null, resolveResourceLinks: null },
    formattedTimePreferences: defaultFormattedTimePreferences,
    getProfileLink: () => "#",
    getThreadLink: () => "#",
    onSelectThread: jest.fn(),
    onReload: jest.fn(),
    onCreate: jest.fn(async () => "ok" as const),
    onReply: jest.fn(),
    onEditMessage: jest.fn(),
    onDeleteMessage: jest.fn(),
    onResolve: jest.fn(),
    ...overrides,
  };
}
let review: ReturnType<typeof useInlineComments>;
function Harness({ value }: { value?: DocumentInlineCommentsProps }) {
  review = useInlineComments(value);
  return (
    <MemoryRouter>
      <div ref={review.contentRef} data-testid="document-content">
        Hello world
      </div>
      {review.floatingAction}
      {review.comments}
    </MemoryRouter>
  );
}
function select() {
  const range = document.createRange();
  const text = screen.getByTestId("document-content").firstChild;
  if (!text) throw new Error("Missing document text");
  range.setStart(text, 0);
  range.setEnd(text, 5);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
  act(() => review.editorOptions?.onSelectionChange?.({ from: 1, to: 6, quote: "Hello" }));
}
function click(testId: string) {
  const element = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
  if (!element) throw new Error(`Missing ${testId}`);
  fireEvent.click(element);
}

it("captures the selection and preserves the draft through version conflicts", async () => {
  const onCreate = jest.fn(async () => "conflict" as const);
  const value = props({ onCreate });
  render(<Harness value={value} />);
  select();
  click("inline-add-selection");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Keep my message" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled());
  expect(onCreate).toHaveBeenCalledWith(
    { sourceVersion: 1, from: 1, to: 6, quote: "Hello" },
    { type: "text", text: "Keep my message" },
  );
  expect(screen.getByRole("textbox")).toHaveValue("Keep my message");
  select();
  click("inline-add-selection");
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
});

it("hides mismatched ranges and requires reselection after a version change", () => {
  const value = props();
  const { rerender } = render(<Harness value={value} />);
  select();
  click("inline-add-selection");
  rerender(<Harness value={{ ...value, documentVersion: 2 }} />);
  expect(review.editorOptions?.ranges).toEqual([]);
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});

it("opens resolved deep links and exposes overlapping threads without choosing one", () => {
  const resolved = { ...thread, id: "resolved", resolvedAt: thread.insertedAt };
  const value = props({ threads: [thread, resolved], activeThreadId: "resolved" });
  const { rerender } = render(<Harness value={value} />);
  expect(review.editorOptions?.ranges.map((range) => range.id)).toEqual(["one", "resolved"]);
  act(() => review.editorOptions?.onThreadClick?.(["one", "resolved"]));
  expect(value.onSelectThread).toHaveBeenLastCalledWith(null);
  rerender(<Harness value={{ ...value, activeThreadId: null }} />);
  expect(document.querySelector('[data-test-id="inline-select-one"]')).toBeVisible();
  expect(document.querySelector('[data-test-id="inline-select-resolved"]')).toBeVisible();
});

it("allows readers to open threads without mutation controls", () => {
  render(<Harness value={props({ canComment: false, activeThreadId: "one" })} />);
  expect(document.querySelector('[data-test-id="inline-thread-one"]')).toBeVisible();
  expect(document.querySelector('[data-test-id="inline-add-selection"]')).toBeNull();
  expect(document.querySelector('[data-test-id="inline-resolve-one"]')).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("does not install inline UI when disabled", () => {
  render(<Harness />);
  expect(review.editorOptions).toBeUndefined();
  expect(review.comments).toBeNull();
});

it("shows comment cards without persistent toolbar buttons", () => {
  render(<Harness value={props()} />);
  expect(document.querySelector('[data-test-id="inline-select-one"]')).toBeVisible();
  expect(document.querySelector('[data-test-id="inline-comments-toggle"]')).toBeNull();
  expect(document.querySelector('[data-test-id="inline-add-toolbar"]')).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("activates a card and immediately offers a reply to commenters", () => {
  const value = props();
  const { rerender } = render(<Harness value={value} />);
  click("inline-select-one");
  expect(value.onSelectThread).toHaveBeenCalledWith("one");
  rerender(<Harness value={{ ...value, activeThreadId: "one" }} />);
  expect(screen.getByRole("textbox")).toBeVisible();
});

it("reserves comment space only for visible threads or a new composer", () => {
  const value = props({ threads: [] });
  const { rerender } = render(<Harness value={value} />);
  expect(review.hasFloatingComments).toBe(false);
  select();
  click("inline-add-selection");
  expect(review.hasFloatingComments).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Cancel draft" }));
  expect(review.hasFloatingComments).toBe(false);
  rerender(<Harness value={{ ...value, threads: [thread] }} />);
  expect(review.hasFloatingComments).toBe(true);
  rerender(<Harness value={value} />);
  expect(review.hasFloatingComments).toBe(false);
});

it.each(["ok", "conflict"] as const)("ignores an old document's %s result", async (result) => {
  let finish: (result: "ok" | "conflict") => void = () => {};
  const request = new Promise<"ok" | "conflict">((resolve) => {
    finish = resolve;
  });
  const first = props({ onCreate: jest.fn(() => request) });
  const view = render(<Harness value={first} />);
  select();
  click("inline-add-selection");
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  view.rerender(<Harness value={props({ draftKey: "other-document" })} />);
  select();
  click("inline-add-selection");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "New document draft" } });
  await act(async () => finish(result));
  expect(screen.getByRole("textbox")).toHaveValue("New document draft");
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
});

it("ignores a previous composer after selecting a new passage in the same document", async () => {
  let finish: (result: "ok") => void = () => {};
  const request = new Promise<"ok">((resolve) => {
    finish = resolve;
  });
  render(<Harness value={props({ onCreate: jest.fn(() => request) })} />);
  select();
  click("inline-add-selection");
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  select();
  click("inline-add-selection");
  await act(async () => finish("ok"));
  expect(screen.getByRole("textbox")).toBeVisible();
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
});

it("lets mobile readers open an unattached thread without a highlight", () => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
  const value = props({
    canComment: false,
    threads: [
      {
        ...thread,
        anchor: {
          ...thread.anchor,
          status: "unattached",
          currentFrom: null,
          currentTo: null,
        },
      },
    ],
  });
  const view = render(<Harness value={value} />);
  expect(review.editorOptions?.ranges).toEqual([]);
  expect(document.querySelector('[data-test-id="inline-select-one"]')).toBeVisible();
  click("inline-select-one");
  expect(value.onSelectThread).toHaveBeenCalledWith("one");
  view.rerender(<Harness value={{ ...value, activeThreadId: "one" }} />);
  expect(document.querySelector('[data-test-id="inline-comments-panel"]')).toBeInTheDocument();
  delete (window as Partial<Window>).matchMedia;
});

it("keeps a newly posted thread selected without activating its reply input", async () => {
  let finish: (result: "ok") => void = () => {};
  const request = new Promise<"ok">((resolve) => {
    finish = resolve;
  });
  const value = props({ threads: [], onCreate: jest.fn(() => request) });
  const view = render(<Harness value={value} />);
  select();
  click("inline-add-selection");
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  // The app refreshes threads and selects the created thread before onCreate completes.
  view.rerender(<Harness value={{ ...value, threads: [thread], activeThreadId: thread.id }} />);
  await act(async () => finish("ok"));
  expect(document.querySelector('[data-test-id="inline-thread-one"]')).toBeVisible();
  expect(document.querySelector('[data-test-id="inline-select-one"]')).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Write a reply" }));
  expect(screen.getByRole("textbox")).toBeVisible();
});
