import React from "react";
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
