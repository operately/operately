import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { ActivityTaskList } from ".";

function tasks(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    key: String(index),
    name: `Task ${index + 1}`,
    path: `/tasks/${index}`,
  }));
}

function list(count: number, locale = "en") {
  return (
    <MemoryRouter>
      <ActivityTaskList tasks={tasks(count)} locale={locale} />
    </MemoryRouter>
  );
}

test.each([0, 1, 2, 3])("renders %i tasks without disclosure", (count) => {
  render(list(count));
  expect(screen.queryAllByRole("link")).toHaveLength(count);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("previews three tasks and expands and collapses the complete ordered list", () => {
  render(list(30));
  expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
    "/tasks/0",
    "/tasks/1",
    "/tasks/2",
  ]);
  const disclosure = screen.getByRole("button");
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("link", { name: "Task 4" })).not.toBeInTheDocument();
  fireEvent.click(disclosure);
  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(
    tasks(30).map((task) => task.path),
  );
  fireEvent.click(disclosure);
  expect(screen.getAllByRole("link")).toHaveLength(3);
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
});

test("updates the remaining count as tasks arrive and are removed", () => {
  const { rerender } = render(list(3));
  rerender(list(4));
  expect(screen.getByRole("button", { name: "Show 1 more task" })).toHaveAttribute("aria-expanded", "false");
  rerender(list(30));
  fireEvent.click(screen.getByRole("button", { name: "Show 27 more tasks" }));
  rerender(list(31));
  expect(screen.getAllByRole("link")).toHaveLength(31);
  fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
  expect(screen.getByRole("button", { name: "Show 28 more tasks" })).toBeInTheDocument();
  rerender(list(4));
  expect(screen.getByRole("button", { name: "Show 1 more task" })).toBeInTheDocument();
  rerender(list(3));
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.getAllByRole("link")).toHaveLength(3);
});

test("keeps expansion local to each item", () => {
  render(
    <MemoryRouter>
      <div data-testid="first">
        <ActivityTaskList tasks={tasks(5)} locale="en" />
      </div>
      <div data-testid="second">
        <ActivityTaskList tasks={tasks(5)} locale="en" />
      </div>
    </MemoryRouter>,
  );
  const first = within(screen.getByTestId("first"));
  const second = within(screen.getByTestId("second"));
  fireEvent.click(first.getByRole("button"));
  expect(first.getAllByRole("link")).toHaveLength(5);
  expect(second.getAllByRole("link")).toHaveLength(3);
  expect(second.getByRole("button")).toHaveAttribute("aria-expanded", "false");
});

test("preserves locale-aware list punctuation and literal names", () => {
  const entries = tasks(3);
  entries[0] = { key: "special", name: "Research <script> & development", path: "/tasks/special" };
  const { container } = render(
    <MemoryRouter>
      <ActivityTaskList tasks={entries} locale="de" />
    </MemoryRouter>,
  );
  expect(container.textContent).toBe(
    new Intl.ListFormat("de", { style: "long", type: "conjunction" }).format(entries.map((task) => task.name)),
  );
  expect(screen.getByRole("link", { name: entries[0].name })).toHaveAttribute("href", entries[0].path);
  expect(container.querySelector("script")).toBeNull();
});
