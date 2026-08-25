import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import type { ProjectTemplate } from "../ApiTypes";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { ProjectTemplatesPage } from ".";

const spaces = [
  { id: "space-1", name: "Marketing", link: "/spaces/space-1" },
  { id: "space-2", name: "Product", link: "/spaces/space-2" },
];

const templates: ProjectTemplate[] = [
  template({ id: "template-1", name: "Campaign launch", space: apiSpace("space-1", "Marketing") }),
  template({
    id: "template-2",
    name: "Product launch",
    space: apiSpace("space-2", "Product"),
    milestoneCount: 1,
    taskCount: 2,
    creator: null,
  }),
];

function template({
  inactivePeopleSummary = { personCount: 0, roleCount: 0, taskCount: 0 },
  inactiveDiscussionCount = 0,
  ...overrides
}: Partial<ProjectTemplate> = {}): ProjectTemplate {
  return {
    __typename: "project_template",
    id: "template",
    name: "Template",
    description: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Reusable plan" }] }],
    }),
    space: apiSpace("space-1", "Marketing"),
    creator: {
      __typename: "person",
      id: "person-1",
      fullName: "Ada Lovelace",
      title: "Engineer",
      avatarUrl: null,
      email: "ada@example.com",
      type: "member",
    },
    insertedAt: "2026-01-01T12:00:00Z",
    updatedAt: "2026-01-02T12:00:00Z",
    milestoneCount: 0,
    taskCount: 0,
    ...overrides,
    inactivePeopleSummary,
    inactiveDiscussionCount,
  };
}

function apiSpace(id: string, name: string): ProjectTemplate["space"] {
  return { __typename: "space", id, name };
}

function renderPage(overrides: Partial<ProjectTemplatesPage.Props> = {}) {
  const props: ProjectTemplatesPage.Props = {
    scope: "company",
    navigation: [{ to: "/home", label: "Home" }],
    templates,
    spaces,
    editableSpaces: spaces,
    templatePath: (id) => `/project-templates/${id}`,
    spaceTemplatesPath: (id) => `/spaces/${id}/project-templates`,
    onCreate: jest.fn().mockResolvedValue({ success: true }),
    onDuplicate: jest.fn().mockResolvedValue({ success: true }),
    onArchive: jest.fn().mockResolvedValue({ success: true }),
    onRestore: jest.fn().mockResolvedValue({ success: true }),
    onDelete: jest.fn().mockResolvedValue({ success: true }),
    formattedTimePreferences: defaultFormattedTimePreferences,
    canCreate: true,
    canEdit: () => true,
    ...overrides,
  };

  return {
    props,
    ...render(
      <MemoryRouter>
        <ProjectTemplatesPage {...props} />
      </MemoryRouter>,
    ),
  };
}

describe("ProjectTemplatesPage", () => {
  it("uses the established Space section paper header", () => {
    const { container } = renderPage();

    const page = container.querySelector('[data-test-id="project-templates-page"]');
    const title = screen.getByText("Project Templates");
    const newTemplateButton = screen.getByRole("button", { name: "New template" });
    const header = title.parentElement?.parentElement;

    expect(page?.parentElement).toHaveClass("lg:max-w-5xl");
    expect(title).toHaveClass("text-lg", "md:text-2xl", "font-extrabold");
    expect(title.parentElement).toHaveClass("min-w-0", "text-center");
    expect(header).toHaveClass("grid", "grid-cols-[auto_minmax(0,1fr)]", "sm:grid-cols-[30%_minmax(0,1fr)_30%]");
    expect(newTemplateButton.parentElement).toHaveClass("min-w-0");
  });

  it("groups company templates by Space and renders card metadata", () => {
    const { container } = renderPage();

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
    expect(container.querySelector('[data-test-id="project-templates-page"]')).toHaveClass("sm:border");
    expect(screen.getByRole("link", { name: "Marketing" })).toHaveAttribute(
      "href",
      "/spaces/space-1/project-templates",
    );
    expect(screen.getByRole("link", { name: "Product" })).toHaveAttribute("href", "/spaces/space-2/project-templates");
    expect(screen.queryByText("0 milestones · 0 tasks")).not.toBeInTheDocument();
    expect(screen.queryByText("1 milestone · 2 tasks")).not.toBeInTheDocument();
    expect(screen.getByText("Creator unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Reusable plan")).toHaveLength(2);
  });

  it("renders a Space-scoped library without company grouping", () => {
    const { container } = renderPage({
      scope: "space",
      navigation: [{ to: "/spaces/space-1", label: "Marketing" }],
      fixedSpace: spaces[0],
      templates: [templates[0]!],
    });

    expect(screen.getByRole("link", { name: "Marketing" })).toHaveAttribute("href", "/spaces/space-1");
    expect(screen.queryByRole("link", { name: "Product" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("project-template-space-filter")).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Active" })).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-id="project-template-grid"]')).toHaveClass("lg:grid-cols-2");
  });

  it("filters templates locally by search", () => {
    renderPage();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Product" } });
    expect(screen.getByText("Product launch")).toBeInTheDocument();
    expect(screen.queryByText("Campaign launch")).not.toBeInTheDocument();
  });

  it("filters templates locally by Space", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "All Spaces" }));
    await user.click(screen.getByRole("button", { name: "Choose another space" }));
    const productOption = await screen.findByRole("button", { name: "Product" });
    await user.click(productOption);

    expect(screen.getByText("Product launch")).toBeInTheDocument();
    expect(screen.queryByText("Campaign launch")).not.toBeInTheDocument();
  });

  it("positions one clear action inside the search field", () => {
    renderPage();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Product" } });
    const clearButton = screen.getByRole("button", { name: "Clear search" });

    expect(clearButton).toHaveClass("absolute", "right-3", "top-1/2");
    fireEvent.click(clearButton);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  it("keeps the creation action in the header when the library is empty", async () => {
    const user = userEvent.setup();
    const { container } = renderPage({ templates: [] });

    const emptyState = container.querySelector('[data-test-id="empty-template-library"]');
    const newTemplateButton = screen.getByRole("button", { name: "New template" });

    expect(screen.getByRole("heading", { name: "Create your first project template" })).toBeInTheDocument();
    expect(screen.getByText("Build a reusable starting point for recurring work.")).toBeInTheDocument();
    expect(emptyState?.querySelector("svg")).toBeNull();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Active" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create template" })).not.toBeInTheDocument();
    expect(newTemplateButton.parentElement).toHaveClass("min-w-0");

    await user.click(newTemplateButton);
    expect(screen.getByRole("heading", { name: "New project template" })).toBeInTheDocument();
  });

  it("shows a read-only empty state without a creation action", () => {
    renderPage({ templates: [], canCreate: false, scope: "space", fixedSpace: spaces[0] });

    expect(screen.getByText("No project templates have been created in this space yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create template" })).not.toBeInTheDocument();
  });

  it("keeps browsing controls available when filters have no matches", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "missing" } });

    expect(screen.getByText("No matching templates.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Active" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("Campaign launch")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("keeps archived templates reachable when there are no active templates", async () => {
    const user = userEvent.setup();
    const archived = template({ id: "archived", name: "Archived launch", archivedAt: "2026-08-01T12:00:00Z" });
    renderPage({ templates: [archived] });

    expect(screen.getByText("No active templates.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View archived" }));
    expect(screen.getByText("Archived launch")).toBeInTheDocument();
  });

  it("hides creation when the requester cannot create templates", () => {
    renderPage({ canCreate: false });
    expect(screen.queryByRole("button", { name: "New template" })).not.toBeInTheDocument();
  });

  it("shows project creation only when the bridge supplies an allowed path", () => {
    const { rerender, props } = renderPage({
      projectCreationPath: (projectTemplate) => `/projects/new?templateId=${projectTemplate.id}`,
    });

    const createProjectLink = screen.getAllByRole("link", { name: "Create project" })[0];

    expect(createProjectLink).toHaveAttribute("href", "/projects/new?templateId=template-1");
    expect(createProjectLink).toHaveClass("flex", "w-full", "justify-between", "rounded-b-xl", "border-t");

    rerender(
      <MemoryRouter>
        <ProjectTemplatesPage {...props} projectCreationPath={() => null} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: "Create project" })).not.toBeInTheDocument();
  });

  it("requires a name and creates in the fixed Space", async () => {
    const onCreate = jest.fn().mockResolvedValue({ success: true });
    const result = renderPage({ scope: "space", fixedSpace: spaces[0], templates: [templates[0]!], onCreate });

    fireEvent.click(screen.getByRole("button", { name: "New template" }));
    expect(screen.queryByTestId("new-project-template-space")).not.toBeInTheDocument();
    const form = result.container.ownerDocument.querySelector('[data-test-id="new-project-template-form"]');
    if (!form) throw new Error("Expected the new template form to be rendered");
    fireEvent.submit(form);
    expect(await screen.findByText("Can't be empty")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Template name/), { target: { value: "Launch plan" } });
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ name: "Launch plan", spaceId: "space-1" }));
  });

  it("switches locally between active and archived templates without an All option", async () => {
    const user = userEvent.setup();
    const archived = template({ id: "archived", name: "Archived launch", archivedAt: "2026-08-01T12:00:00Z" });
    const { container } = renderPage({ templates: [...templates, archived] });

    expect(screen.queryByText("Archived launch")).not.toBeInTheDocument();

    const trigger = container.ownerDocument.querySelector('[data-test-id="project-template-status-filter"]');
    if (!trigger) throw new Error("Expected status filter");
    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Archived" }));

    expect(screen.getByText("Archived launch")).toBeInTheDocument();
    expect(screen.queryByText("Campaign launch")).not.toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole("menuitem", { name: "All" })).not.toBeInTheDocument();
  });

  it("duplicates an active template with an editable prefilled name", async () => {
    const user = userEvent.setup();
    const onDuplicate = jest.fn().mockResolvedValue({ success: true });
    const { container } = renderPage({ onDuplicate });

    const actions = container.ownerDocument.querySelector('[data-test-id="project-template-actions-template-1"]');
    if (!actions) throw new Error("Expected template actions");
    await user.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));

    const name = screen.getByLabelText(/Template name/);
    expect(name).toHaveValue("Copy of Campaign launch");
    await user.clear(name);
    await user.type(name, "Campaign launch v2");
    await user.click(screen.getByRole("button", { name: "Duplicate template" }));

    await waitFor(() => expect(onDuplicate).toHaveBeenCalledWith("template-1", "Campaign launch v2"));
  });

  it("optimistically removes a template and closes the dialog while archiving", async () => {
    const user = userEvent.setup();
    const onArchive = jest.fn(() => new Promise<ProjectTemplatesPage.MutationResult>(() => undefined));
    const { container } = renderPage({ onArchive });

    const actions = container.ownerDocument.querySelector('[data-test-id="project-template-actions-template-1"]');
    if (!actions) throw new Error("Expected template actions");
    await user.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));

    expect(
      screen.getByText("This template will leave project creation and can be restored later."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Archive template" }));
    await waitFor(() => expect(onArchive).toHaveBeenCalledWith("template-1"));
    expect(screen.queryByText("Campaign launch")).not.toBeInTheDocument();
    expect(screen.getByText("Product launch")).toBeInTheDocument();
    expect(
      screen.queryByText("This template will leave project creation and can be restored later."),
    ).not.toBeInTheDocument();
  });

  it("rolls back an optimistic lifecycle update when the mutation fails", async () => {
    const user = userEvent.setup();
    const onArchive = jest.fn().mockResolvedValue({ success: false, error: "Could not archive" });
    const { container } = renderPage({ onArchive });

    const actions = container.ownerDocument.querySelector('[data-test-id="project-template-actions-template-1"]');
    if (!actions) throw new Error("Expected template actions");
    await user.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Archive template" }));

    await waitFor(() => expect(onArchive).toHaveBeenCalledWith("template-1"));
    expect(screen.getByText("Campaign launch")).toBeInTheDocument();
  });

  it("optimistically removes a restored template from the archived view", async () => {
    const user = userEvent.setup();
    const archived = template({ ...templates[0], archivedAt: "2026-08-01T12:00:00Z" });
    const onRestore = jest.fn().mockResolvedValue({ success: true });
    const { container } = renderPage({ templates: [archived], onRestore });
    const statusFilter = container.ownerDocument.querySelector('[data-test-id="project-template-status-filter"]');
    if (!statusFilter) throw new Error("Expected status filter");

    await user.click(statusFilter);
    await user.click(screen.getByRole("menuitem", { name: "Archived" }));
    const actions = container.ownerDocument.querySelector('[data-test-id="project-template-actions-template-1"]');
    if (!actions) throw new Error("Expected template actions");
    await user.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Restore" }));
    await user.click(screen.getByRole("button", { name: "Restore template" }));

    await waitFor(() => expect(onRestore).toHaveBeenCalledWith("template-1"));
    expect(screen.queryByText("Campaign launch")).not.toBeInTheDocument();
  });

  it("optimistically removes a deleted template", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockResolvedValue({ success: true });
    const { container } = renderPage({ onDelete });
    const actions = container.ownerDocument.querySelector('[data-test-id="project-template-actions-template-1"]');
    if (!actions) throw new Error("Expected template actions");

    await user.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete template" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("template-1"));
    expect(screen.queryByText("Campaign launch")).not.toBeInTheDocument();
  });

  it("shows only restore and delete for manageable archived templates", async () => {
    const user = userEvent.setup();
    const archived = template({ ...templates[0], archivedAt: "2026-08-01T12:00:00Z" });
    const { container } = renderPage({ templates: [archived], projectCreationPath: () => "/projects/new" });
    const statusFilter = container.ownerDocument.querySelector('[data-test-id="project-template-status-filter"]');
    if (!statusFilter) throw new Error("Expected status filter");

    await user.click(statusFilter);
    await user.click(screen.getByRole("menuitem", { name: "Archived" }));

    expect(screen.getAllByText("Archived")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Create project" })).not.toBeInTheDocument();

    const actions = container.ownerDocument.querySelector('[data-test-id="project-template-actions-template-1"]');
    if (!actions) throw new Error("Expected template actions");
    await user.click(actions);
    expect(screen.getByRole("menuitem", { name: "Restore" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Duplicate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
  });

  it("hides lifecycle actions without edit permission", () => {
    const { container } = renderPage({ canEdit: () => false });

    expect(container.ownerDocument.querySelector('[data-test-id="project-template-actions-template-1"]')).toBeNull();
  });
});
