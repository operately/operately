import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";

import { GlobalSearch } from "./index";

const results: GlobalSearch.SearchResult = {
  spaces: [{ id: "space-1", name: "Space result", link: "/spaces/1" }],
  goals: [{ id: "goal-1", name: "Goal result", link: "/goals/1" }],
  projects: [{ id: "project-1", name: "Project result", link: "/projects/1" }],
  milestones: [{ id: "milestone-1", title: "Milestone result", link: "/milestones/1" }],
  tasks: [{ id: "task-1", name: "Task result", link: "/tasks/1" }],
  people: [{ id: "person-1", fullName: "Person result", link: "/people/1" }],
  discussions: [
    {
      id: "discussion-1",
      name: "Discussion result",
      context: "Product Space",
      link: "/discussions/1",
    },
  ],
  folders: [{ id: "folder-1", name: "Folder result", context: "Product Space", link: "/folders/1" }],
  documents: [{ id: "document-1", name: "Document result", context: "Product Space", link: "/documents/1" }],
  files: [{ id: "file-1", name: "File result", context: "Product Space", link: "/files/1" }],
  links: [{ id: "link-1", name: "Link result", context: "Product Space", link: "/links/1" }],
};

function openSearch(
  search: GlobalSearch.SearchFn,
  onNavigate = jest.fn(),
  fullTextSearchPath?: GlobalSearch.Props["fullTextSearchPath"],
) {
  render(<GlobalSearch search={search} onNavigate={onNavigate} fullTextSearchPath={fullTextSearchPath} />);
  fireEvent.click(screen.getByRole("button", { name: /search/i }));

  return {
    input: screen.getByRole("combobox"),
    onNavigate,
  };
}

async function enterQuery(input: HTMLElement, query = "result") {
  fireEvent.change(input, { target: { value: query } });
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
}

describe("GlobalSearch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("opens with Cmd/Ctrl + K", () => {
    render(<GlobalSearch search={jest.fn().mockResolvedValue({})} onNavigate={jest.fn()} />);

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  test("renders all groups in quick-navigation order with accessible options", async () => {
    const { input } = openSearch(jest.fn().mockResolvedValue(results));
    await enterQuery(input);

    const listbox = await screen.findByRole("listbox");
    const headers = within(listbox)
      .getAllByRole("group")
      .map((group) => group.getAttribute("aria-label"));

    expect(headers).toEqual([
      "SPACES",
      "GOALS",
      "PROJECTS",
      "MILESTONES",
      "TASKS",
      "PEOPLE",
      "DISCUSSIONS",
      "FOLDERS",
      "DOCUMENTS",
      "FILES",
      "LINKS",
    ]);

    expect(within(listbox).getAllByText("Product Space")).toHaveLength(5);
    expect(within(listbox).getAllByRole("option")).toHaveLength(11);
    expect(screen.queryByText(/Search all content for/)).not.toBeInTheDocument();
  });

  test("renders the full-text action after a divider and navigates with the trimmed query", async () => {
    const fullTextSearchPath = (query: string) => `/search?${new URLSearchParams({ q: query })}`;
    const { input, onNavigate } = openSearch(jest.fn().mockResolvedValue(results), jest.fn(), fullTextSearchPath);

    await enterQuery(input, "  customer plans  ");

    const action = await screen.findByRole("option", {
      name: "Search all content for “customer plans”",
    });
    expect(action.parentElement).toHaveClass("border-t");

    fireEvent.click(action);

    expect(onNavigate).toHaveBeenCalledWith("/search?q=customer+plans");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  test("includes the full-text action in keyboard wraparound and Enter navigation", async () => {
    const scrollIntoView = jest.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const fullTextSearchPath = (query: string) => `/search?${new URLSearchParams({ q: query })}`;
    const { input, onNavigate } = openSearch(jest.fn().mockResolvedValue(results), jest.fn(), fullTextSearchPath);
    await enterQuery(input, "result");
    await screen.findByRole("listbox");

    fireEvent.keyDown(input, { key: "ArrowUp" });

    const selectedOption = screen.getByRole("option", { selected: true });
    expect(selectedOption).toHaveTextContent("Search all content for “result”");
    expect(input).toHaveAttribute("aria-activedescendant", selectedOption.id);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onNavigate).toHaveBeenCalledWith("/search?q=result");
  });

  test("supports keyboard wraparound, exposes selection, scrolls it into view, and navigates with Enter", async () => {
    const scrollIntoView = jest.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const { input, onNavigate } = openSearch(jest.fn().mockResolvedValue(results));
    await enterQuery(input);
    await screen.findByRole("listbox");

    fireEvent.keyDown(input, { key: "ArrowUp" });

    const selectedOption = screen.getByRole("option", { selected: true });
    expect(selectedOption).toHaveTextContent("Link result");
    expect(input).toHaveAttribute("aria-activedescendant", selectedOption.id);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onNavigate).toHaveBeenCalledWith("/links/1");
  });

  test("shows distinct loading and empty states in a live region", async () => {
    let resolveSearch: (value: GlobalSearch.SearchResult) => void = () => {};
    const pendingSearch = new Promise<GlobalSearch.SearchResult>((resolve) => {
      resolveSearch = resolve;
    });

    const fullTextSearchPath = (query: string) => `/search?q=${query}`;
    const { input } = openSearch(jest.fn().mockReturnValue(pendingSearch), jest.fn(), fullTextSearchPath);
    await enterQuery(input, "missing");

    expect(screen.getByRole("status")).toHaveTextContent("Searching…");
    expect(screen.getByRole("option")).toHaveTextContent("Search all content for “missing”");

    await act(async () => {
      resolveSearch({});
      await pendingSearch;
    });

    expect(screen.getByRole("status")).toHaveTextContent("No title or name matches for “missing”.");
    expect(screen.getByRole("option")).toHaveTextContent("Search all content for “missing”");
  });

  test("shows quick-search failures as an error", async () => {
    const failure = new Error("unavailable");
    const failingSearch = jest.fn().mockRejectedValue(failure);
    const fullTextSearchPath = (query: string) => `/search?q=${query}`;
    const { input } = openSearch(failingSearch, jest.fn(), fullTextSearchPath);
    await enterQuery(input, "failure");

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Quick search is unavailable."));
    expect(screen.getByRole("option")).toHaveTextContent("Search all content for “failure”");
  });

  test("does not render the full-text action for a short query", async () => {
    const fullTextSearchPath = (query: string) => `/search?q=${query}`;
    const { input } = openSearch(jest.fn().mockResolvedValue({}), jest.fn(), fullTextSearchPath);

    await enterQuery(input, "a");

    expect(screen.queryByText(/Search all content for/)).not.toBeInTheDocument();
  });

  test("keeps long result names truncated", async () => {
    const longName = "A very long document title that should stay on one compact quick-search result row";
    const { input } = openSearch(
      jest.fn().mockResolvedValue({
        documents: [{ id: "document-long", name: longName, context: "Research", link: "/documents/long" }],
      }),
    );

    await enterQuery(input, "document");

    const name = await screen.findByText(longName);
    expect(name).toHaveClass("truncate");
  });
});
