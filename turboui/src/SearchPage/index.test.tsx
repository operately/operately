import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import type { SearchResult } from "../ApiTypes";
import { SearchPage } from "./index";

function result(overrides: Partial<SearchResult & { link: string }> = {}): SearchResult & { link: string } {
  return {
    __typename: "result",
    id: "result-1",
    type: "project",
    title: "Website redesign",
    context: "Marketing",
    matchedField: "description",
    snippet: "Customer research supports the new information architecture.",
    state: "closed",
    navigationTarget: { projectId: "project-1" },
    link: "/acme/projects/project-1",
    ...overrides,
  };
}

function renderPage(props: Partial<React.ComponentProps<typeof SearchPage>> = {}) {
  const defaultProps: React.ComponentProps<typeof SearchPage> = {
    query: "",
    status: "initial",
    results: [],
    onQueryChange: jest.fn(),
  };

  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SearchPage {...defaultProps} {...props} />
    </MemoryRouter>,
  );
}

describe("SearchPage", () => {
  test("renders the initial state and keeps the search field focused", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Search" })).toBeInTheDocument();
    const input = screen.getByRole("searchbox", { name: "Search titles and content…" });
    expect(input).toHaveFocus();
    expect(screen.getByText("Search across projects, goals, discussions, documents, and more.")).toBeInTheDocument();
  });

  test("reports query changes without managing the request", () => {
    const onQueryChange = jest.fn();
    renderPage({ onQueryChange });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "customer evidence" } });

    expect(onQueryChange).toHaveBeenCalledWith("customer evidence");
  });

  test("renders loading, empty, and error states accessibly", () => {
    const { rerender } = renderPage({ query: "evidence", status: "loading" });
    expect(screen.getByRole("status")).toHaveTextContent("Searching…");

    rerender(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SearchPage query="evidence" status="success" results={[]} onQueryChange={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("No content found for “evidence”. Try different keywords.");

    rerender(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SearchPage query="evidence" status="error" results={[]} onQueryChange={jest.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Search is unavailable. Try again.");
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });

  test("renders result metadata, state, snippet, and navigation", () => {
    renderPage({ query: "research", status: "success", results: [result()] });

    expect(screen.getByRole("status")).toHaveTextContent("1 result found.");
    expect(screen.getByRole("link", { name: /Website redesign/ })).toHaveAttribute("href", "/acme/projects/project-1");
    expect(screen.getByText("Project")).toBeInTheDocument();
    expect(screen.getByText("In Marketing")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("Matched in description")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-snippet")).toHaveTextContent(
      "Customer research supports the new information architecture.",
    );
  });

  test("uses the Resource Hub document icon and makes the resource hierarchy explicit", () => {
    renderPage({
      query: "runway",
      status: "success",
      results: [
        result({
          type: "resource_hub_document",
          title: "Runway and Revenue Review",
          context: "Extend runway from Series A",
        }),
      ],
    });

    expect(screen.getByText("Document")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Runway and Revenue Review" })).toBeInTheDocument();
    expect(screen.getByText("In Extend runway from Series A")).toBeInTheDocument();
    expect(screen.queryByText("Document · Extend runway from Series A")).not.toBeInTheDocument();

    const icon = screen.getByTestId("search-result-icon");
    expect(icon).toHaveClass("h-12", "w-12", "self-start");
    expect(icon.querySelector(".border-stroke-base")).toBeInTheDocument();
  });

  test("highlights matching query terms in titles and snippets without rendering HTML", () => {
    const { container } = renderPage({
      query: "improve",
      status: "success",
      results: [
        result({
          title: "Improve customer onboarding",
          snippet: "The team improved <strong>activation</strong> this quarter.",
        }),
      ],
    });

    expect(Array.from(container.querySelectorAll("mark")).map((mark) => mark.textContent)).toEqual([
      "Improve",
      "improve",
    ]);
    expect(screen.getByTestId("search-result-snippet")).toHaveTextContent(
      "The team improved <strong>activation</strong> this quarter.",
    );
    expect(container.querySelector("strong")).not.toBeInTheDocument();
  });

  test("renders all indexed resource labels and caps the visible list at 30 results", () => {
    const types: SearchResult["type"][] = [
      "resource_hub_folder",
      "resource_hub_document",
      "resource_hub_file",
      "resource_hub_link",
      "project",
      "goal",
      "discussion",
      "project_check_in",
      "goal_check_in",
      "project_retrospective",
    ];
    const typeResults = types.map((type, index) =>
      result({ id: `type-${index}`, type, title: `Result ${index}`, link: `/result-${index}`, state: null }),
    );
    const extraResults = Array.from({ length: 25 }, (_, index) =>
      result({ id: `extra-${index}`, title: `Extra ${index}`, link: `/extra-${index}`, state: null }),
    );

    const { container } = renderPage({
      query: "result",
      status: "success",
      results: [...typeResults, ...extraResults],
    });

    expect(container.querySelectorAll('[data-test-id="company-search-result"]')).toHaveLength(30);
    expect(screen.getByText("Folder")).toBeInTheDocument();
    expect(screen.getByText("Document")).toBeInTheDocument();
    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByText("Project check-in")).toBeInTheDocument();
    expect(screen.getByText("Goal check-in")).toBeInTheDocument();
    expect(screen.getByText("Project retrospective")).toBeInTheDocument();
    expect(screen.getAllByText("In Marketing")).toHaveLength(30);
  });
});
