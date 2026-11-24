import React from "react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { ResourceList } from "./ResourceList";
import type { ResourceSuggestion } from ".";

const project: ResourceSuggestion = { id: "project", title: "Project", type: "project", url: "/projects/project" };
const goal: ResourceSuggestion = { id: "goal", title: "Goal", type: "goal", url: "/goals/goal" };

it("ignores stale results when the query changes and selects the current result", async () => {
  let finishOld: (items: ResourceSuggestion[]) => void = () => {};
  const search = jest.fn((query: string) =>
    query === "old"
      ? new Promise<ResourceSuggestion[]>((resolve) => {
          finishOld = resolve;
        })
      : Promise.resolve([goal]),
  );
  const command = jest.fn();
  const ref = React.createRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }>();
  const { rerender } = render(<ResourceList ref={ref} query="old" search={search} command={command} />);
  await waitFor(() => expect(search).toHaveBeenCalledWith("old"));
  rerender(<ResourceList ref={ref} query="new" search={search} command={command} />);
  await waitFor(() => expect(document.querySelector('[data-test-id="mention-resource-goal-goal"]')).not.toBeNull());
  await act(async () => finishOld([project]));
  expect(document.querySelector('[data-test-id="mention-resource-project-project"]')).toBeNull();
  act(() => ref.current?.onKeyDown({ event: new KeyboardEvent("keydown", { key: "Enter" }) }));
  expect(command).toHaveBeenCalledWith(goal);
});

it("shows request failure and never inserts a result", async () => {
  const command = jest.fn();
  render(
    <ResourceList
      query="broken"
      search={async () => {
        throw new Error("network");
      }}
      command={command}
    />,
  );
  await waitFor(() =>
    expect(document.querySelector('[role="status"]')?.textContent).toContain("Could not search work"),
  );
  expect(command).not.toHaveBeenCalled();
});

it("requires two characters and supports pointer selection", async () => {
  const search = jest.fn().mockResolvedValue([project]);
  const command = jest.fn();
  const { rerender } = render(<ResourceList query="p" search={search} command={command} />);
  expect(search).not.toHaveBeenCalled();
  rerender(<ResourceList query="pr" search={search} command={command} />);
  const option = await waitFor(() => {
    const element = document.querySelector('[data-test-id="mention-resource-project-project"]');
    expect(element).not.toBeNull();
    return element;
  });
  if (!option) throw new Error("Resource option missing");
  fireEvent.click(option);
  expect(command).toHaveBeenCalledWith(project);
});

it("moves through results with arrow keys before Enter", async () => {
  const ref = React.createRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }>();
  const command = jest.fn();
  render(<ResourceList ref={ref} query="work" search={async () => [project, goal]} command={command} />);
  await waitFor(() => expect(document.querySelector('[data-test-id="mention-resource-goal-goal"]')).not.toBeNull());
  act(() => ref.current?.onKeyDown({ event: new KeyboardEvent("keydown", { key: "ArrowDown" }) }));
  act(() => ref.current?.onKeyDown({ event: new KeyboardEvent("keydown", { key: "Enter" }) }));
  expect(command).toHaveBeenCalledWith(goal);
});

it("debounces typing and cancels pending searches when the query changes or the picker closes", async () => {
  jest.useFakeTimers();
  try {
    const search = jest.fn().mockResolvedValue([]);
    const command = jest.fn();
    const { rerender, unmount } = render(<ResourceList query="wo" search={search} command={command} />);
    await act(async () => jest.advanceTimersByTime(200));
    expect(search).not.toHaveBeenCalled();
    rerender(<ResourceList query="work" search={search} command={command} />);
    await act(async () => jest.advanceTimersByTime(299));
    expect(search).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(1));
    expect(search.mock.calls).toEqual([["work"]]);
    rerender(<ResourceList query="working" search={search} command={command} />);
    unmount();
    await act(async () => jest.advanceTimersByTime(300));
    expect(search).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

it("connects the editor to the highlighted result, scrolls it into view, and clears connections on close", async () => {
  const editor = new Editor({ extensions: [StarterKit] });
  const scrollIntoView = jest.fn();
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
  const ref = React.createRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }>();
  const search = jest.fn().mockResolvedValue([project, goal]);
  try {
    const { getByRole, unmount, rerender } = render(
      <ResourceList ref={ref} editor={editor} query="work" search={search} command={jest.fn()} />,
    );
    await waitFor(() => expect(getByRole("listbox")).toBeTruthy());
    const list = getByRole("listbox");
    const first = getByRole("option", { selected: true });
    expect(editor.view.dom.getAttribute("role")).toBe("textbox");
    expect(editor.view.dom.getAttribute("aria-controls")).toBe(list.id);
    expect(first.id).toBeTruthy();
    expect(editor.view.dom.getAttribute("aria-activedescendant")).toBe(first.id);
    scrollIntoView.mockClear();
    act(() => ref.current?.onKeyDown({ event: new KeyboardEvent("keydown", { key: "ArrowDown" }) }));
    const second = getByRole("option", { selected: true });
    expect(second.id).not.toBe(first.id);
    expect(editor.view.dom.getAttribute("aria-activedescendant")).toBe(second.id);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "nearest" });
    expect(scrollIntoView.mock.instances.slice(-1)[0]).toBe(second);
    rerender(<ResourceList ref={ref} editor={editor} query="w" search={search} command={jest.fn()} />);
    expect(editor.view.dom.hasAttribute("aria-activedescendant")).toBe(false);
    unmount();
    expect(editor.view.dom.hasAttribute("aria-controls")).toBe(false);
    expect(editor.view.dom.hasAttribute("aria-haspopup")).toBe(false);
    expect(editor.view.dom.getAttribute("role")).toBe("textbox");
  } finally {
    editor.destroy();
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  }
});
