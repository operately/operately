import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import { Discussions } from "./Discussions";
import type { ProjectPage } from ".";
import { generatePermissions } from "../utils/storybook/permissions";

const props = {
  discussions: [] as ProjectPage.State["discussions"],
  permissions: generatePermissions(true),
  state: "active",
  newDiscussionLink: "/new",
} as ProjectPage.State;

it("shows the header and action without a premature empty state", () => {
  const { rerender } = render(
    <MemoryRouter>
      <Discussions {...props} discussionsLoading />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: "Discussions" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Start discussion" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.queryByText("No discussions yet")).not.toBeInTheDocument();
  rerender(
    <MemoryRouter>
      <Discussions {...props} />
    </MemoryRouter>,
  );
  expect(screen.getByText("No discussions yet")).toBeInTheDocument();
});

it("shows loading and errors to readers even when the list is empty", () => {
  const readOnly = { ...props, permissions: { ...props.permissions, canEdit: false } };
  const { rerender } = render(
    <MemoryRouter>
      <Discussions {...readOnly} discussionsLoading />
    </MemoryRouter>,
  );
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  rerender(
    <MemoryRouter>
      <Discussions {...readOnly} discussionsError />
    </MemoryRouter>,
  );
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText("No discussions yet")).not.toBeInTheDocument();
});
