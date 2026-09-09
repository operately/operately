import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Task } from "@/api";
import { Paths } from "@/routes/paths";
import { taskLink } from "./feedItemLinks";

jest.mock("turboui", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

it("builds task links outside a React render using the supplied company paths", () => {
  const task: Task = { __typename: "task", id: "task-1", name: "Task", type: "project" };
  const paths = new Paths({ companyId: "company-1" });

  // Calling the helpers before rendering ensures they do not invoke hooks.
  const projectTaskLink = taskLink(paths, task);
  const spaceTaskLink = taskLink(paths, task, { spaceId: "space-1" });

  expect(renderToStaticMarkup(projectTaskLink)).toContain(`href="${paths.taskPath(task.id)}"`);
  expect(renderToStaticMarkup(spaceTaskLink)).toContain(
    `href="${paths.spaceKanbanPath("space-1", { taskId: task.id })}"`,
  );
});
