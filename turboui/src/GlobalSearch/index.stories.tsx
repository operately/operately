import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { GlobalSearch, SearchResults } from "./index";

const meta: Meta<typeof GlobalSearch> = {
  title: "Components/GlobalSearch",
  component: GlobalSearch,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof GlobalSearch>;

const mockSearchResults: GlobalSearch.SearchResult = {
  projects: [
    {
      id: "1",
      name: "Website Redesign",
      link: "/projects/1",
      champion: { fullName: "John Doe" },
      space: { name: "Marketing" },
    },
    {
      id: "2",
      name: "Mobile App Development",
      link: "/projects/2",
      champion: { fullName: "Jane Smith" },
      space: { name: "Engineering" },
    },
  ],
  goals: [
    {
      id: "1",
      name: "Increase User Engagement",
      link: "/goals/1",
      champion: { fullName: "Alice Johnson" },
      space: { name: "Product" },
    },
    {
      id: "2",
      name: "Improve Performance Metrics",
      link: "/goals/2",
      champion: { fullName: "Bob Wilson" },
      space: { name: "Engineering" },
    },
  ],
  tasks: [
    {
      id: "1",
      name: "Implement user authentication",
      link: "/tasks/1",
      milestone: {
        project: {
          name: "Mobile App Development",
          space: { name: "Engineering" },
        },
      },
    },
    {
      id: "2",
      name: "Design landing page mockups",
      link: "/tasks/2",
      milestone: {
        project: {
          name: "Website Redesign",
          space: { name: "Marketing" },
        },
      },
    },
  ],
  people: [
    {
      id: "1",
      fullName: "John Doe",
      title: "Senior Developer",
      link: "/people/1",
    },
    {
      id: "2",
      fullName: "Jane Smith",
      title: "Product Manager",
      link: "/people/2",
    },
  ],
};

const mockEmptyResults: GlobalSearch.SearchResult = {
  projects: [],
  goals: [],
  tasks: [],
  people: [],
};

const mockSearch: GlobalSearch.SearchFn = async ({ query }) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (query.toLowerCase().includes("design") || query.toLowerCase().includes("dev")) {
    return mockSearchResults;
  }

  if (query.toLowerCase().includes("empty")) {
    return mockEmptyResults;
  }

  // Partial results based on query
  const filteredResults: GlobalSearch.SearchResult = {};

  if (query.toLowerCase().includes("project")) {
    filteredResults.projects = mockSearchResults.projects;
  }

  if (query.toLowerCase().includes("goal")) {
    filteredResults.goals = mockSearchResults.goals;
  }

  if (query.toLowerCase().includes("task")) {
    filteredResults.tasks = mockSearchResults.tasks;
  }

  if (query.toLowerCase().includes("people") || query.toLowerCase().includes("person")) {
    filteredResults.people = mockSearchResults.people;
  }

  // Default: return a mix of results
  if (Object.keys(filteredResults).length === 0) {
    return {
      projects: mockSearchResults.projects?.slice(0, 2),
      goals: mockSearchResults.goals?.slice(0, 1),
      people: mockSearchResults.people?.slice(0, 1),
    };
  }

  return filteredResults;
};

export const Default: Story = {
  args: {
    search: mockSearch,
    onNavigate: (link) => {
      console.log("Navigate to:", link);
      alert(`Would navigate to: ${link}`);
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <div className="mb-4 text-sm text-gray-600">
          <p>Try searching for:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>"design" or "dev" - Full results</li>
            <li>"project" - Projects only</li>
            <li>"goal" - Goals only</li>
            <li>"task" - Tasks only</li>
            <li>"people" - People only</li>
            <li>"empty" - No results</li>
            <li>Any other term - Mixed results</li>
          </ul>
          <p className="mt-2 text-xs">Press Cmd/Ctrl + K to focus the search input</p>
        </div>
        <Story />
      </div>
    ),
  ],
};

const SearchOverlayDemo = ({
  search,
  onNavigate,
  initialQuery = "dev",
  placeholder = "Search...",
}: {
  search: GlobalSearch.SearchFn;
  onNavigate: (link: string) => void;
  initialQuery?: string;
  placeholder?: string;
}) => {
  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<GlobalSearch.SearchResult>({});
  const [isSearching, setIsSearching] = React.useState(false);

  const state: GlobalSearch.State = {
    search,
    onNavigate,
    placeholder,
    testId: "global-search-demo",
    isOpen: true,
    setIsOpen: () => {},
    query,
    setQuery,
    results,
    setResults,
    isSearching,
    setIsSearching,
  };

  // Perform search when query changes
  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults({});
      return;
    }

    setIsSearching(true);
    search({ query: query.trim() })
      .then((searchResults) => {
        setResults(searchResults);
      })
      .catch((error) => {
        console.error("Search failed:", error);
        setResults({});
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, [query, search]);

  // Initialize with search results on mount
  React.useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      setIsSearching(true);
      search({ query: initialQuery.trim() })
        .then(setResults)
        .catch(() => setResults({}))
        .finally(() => setIsSearching(false));
    }
  }, [initialQuery, search]);

  return (
    <div className="relative w-full">
      <div className="w-[800px] max-w-[90vw] bg-surface-base border border-surface-outline rounded-b-lg shadow-lg">
        <div className="overflow-y-auto">
          <SearchResults state={state} onClose={() => {}} flatResults={[]} />
        </div>
      </div>
    </div>
  );
};

export const SearchResultsDropdown: Story = {
  render: (args) => <SearchOverlayDemo search={args.search} onNavigate={args.onNavigate} initialQuery="design" />,
  args: {
    search: mockSearch,
    onNavigate: (link) => {
      console.log("Navigate to:", link);
      alert(`Would navigate to: ${link}`);
    },
  },
};
