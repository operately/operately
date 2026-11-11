import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Task } from "@/api";
import { Paths } from "@/routes/paths";
import { spaceTaskPath, taskLink } from "./feedItemLinks";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

it.each([
  [{ id: "task-1", boardId: "board-1" }, "/company-1/spaces/space-1/boards/board-1?taskId=task-1"],
  [{ id: "task-1", boardId: null }, "/company-1/spaces/space-1"],
  [{ id: "task-1" }, "/company-1/spaces/space-1"],
  [null, "/company-1/spaces/space-1"],
] as const)("resolves a space task activity destination with a safe fallback (%j)", (task, expectedPath) => {
  const paths = new Paths({ companyId: "company-1" });
  expect(spaceTaskPath(paths, "space-1", task)).toBe(expectedPath);
});

it("builds task links outside a React render using the supplied company paths", () => {
  const task: Task = { __typename: "task", boardId: "board-1", id: "task-1", name: "Task", type: "project" };
  const paths = new Paths({ companyId: "company-1" });

  // Calling the helpers before rendering ensures they do not invoke hooks.
  const projectTaskLink = taskLink(paths, task);
  const spaceTaskLink = taskLink(paths, task, { spaceId: "space-1" });

  expect(renderToStaticMarkup(projectTaskLink)).toContain(`href="${paths.taskPath(task.id)}"`);
  expect(renderToStaticMarkup(spaceTaskLink)).toContain(
    `href="${paths.spaceKanbanPath("space-1", "board-1", { taskId: task.id })}"`,
  );
});
