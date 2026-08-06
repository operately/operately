import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
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

function template(overrides: Partial<ProjectTemplate>): ProjectTemplate {
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
    onFilter: jest.fn().mockResolvedValue(templates),
    onCreate: jest.fn().mockResolvedValue({ success: true }),
    formattedTimePreferences: defaultFormattedTimePreferences,
    canCreate: true,
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
  it("groups company templates by Space and renders card metadata", () => {
    const { container } = renderPage();

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
    expect(container.querySelector('[data-test-id="project-templates-page"]')).toHaveClass("sm:border");
    expect(screen.getByRole("link", { name: "Marketing" })).toHaveAttribute(
      "href",
      "/spaces/space-1/project-templates",
    );
    expect(screen.getByRole("link", { name: "Product" })).toHaveAttribute("href", "/spaces/space-2/project-templates");
    expect(screen.getByText("0 milestones · 0 tasks")).toBeInTheDocument();
    expect(screen.getByText("1 milestone · 2 tasks")).toBeInTheDocument();
    expect(screen.getByText("Creator unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Reusable plan")).toHaveLength(2);
  });

  it("renders a Space-scoped library without company grouping", () => {
    renderPage({
      scope: "space",
      navigation: [{ to: "/spaces/space-1", label: "Marketing" }],
      fixedSpace: spaces[0],
      templates: [templates[0]!],
    });

    expect(screen.getByRole("link", { name: "Marketing" })).toHaveAttribute("href", "/spaces/space-1");
    expect(screen.queryByRole("link", { name: "Product" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("project-template-space-filter")).not.toBeInTheDocument();
  });

  it("debounces search", async () => {
    jest.useFakeTimers();
    const onFilter = jest.fn().mockResolvedValue([templates[1]!]);
    renderPage({ onFilter });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Product" } });
    expect(onFilter).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(screen.getByText("Product launch")).toBeInTheDocument());
    expect(screen.queryByText("Campaign launch")).not.toBeInTheDocument();
    jest.useRealTimers();
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

  it("ignores a stale search response", async () => {
    jest.useFakeTimers();
    let resolveCampaign: (templates: ProjectTemplate[]) => void = () => undefined;
    const onFilter = jest.fn().mockResolvedValue(templates);
    renderPage({ onFilter });
    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    onFilter
      .mockImplementationOnce(
        () =>
          new Promise<ProjectTemplate[]>((resolve) => {
            resolveCampaign = resolve;
          }),
      )
      .mockResolvedValueOnce([templates[1]!]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Campaign" } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Product" } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await act(async () => resolveCampaign([templates[0]!]));

    expect(screen.getByText("Product launch")).toBeInTheDocument();
    expect(screen.queryByText("Campaign launch")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("shows the empty and no-results states", async () => {
    const { rerender, props } = renderPage({ templates: [] });
    expect(screen.getByText("No project templates yet.")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProjectTemplatesPage {...props} templates={[]} onFilter={jest.fn().mockResolvedValue([])} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "missing" } });
    expect(await screen.findByText("No matching templates. Try a different search or Space.")).toBeInTheDocument();
  });

  it("hides creation when the requester cannot create templates", () => {
    renderPage({ canCreate: false });
    expect(screen.queryByRole("button", { name: "New template" })).not.toBeInTheDocument();
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
});
