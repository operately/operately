import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { GlobalSearch } from "./index";

const meta: Meta<typeof GlobalSearch> = {
  title: "Components/GlobalSearch",
  component: GlobalSearch,
  parameters: {
    layout: "centered",
  },
  args: {
    onNavigate: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof GlobalSearch>;

const allGroups: GlobalSearch.SearchResult = {
  spaces: [{ id: "space-1", name: "Product", link: "/spaces/1" }],
  goals: [
    {
      id: "goal-1",
      name: "Increase user engagement",
      link: "/goals/1",
      champion: { fullName: "Alice Johnson" },
      space: { name: "Product" },
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Website redesign",
      link: "/projects/1",
      champion: { fullName: "John Doe" },
      space: { name: "Marketing" },
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      title: "Launch milestone",
      link: "/milestones/1",
      project: { name: "Website redesign" },
      space: { name: "Marketing" },
    },
  ],
  tasks: [
    {
      id: "task-1",
      name: "Design landing page",
      link: "/tasks/1",
      project: { name: "Website redesign" },
      space: { name: "Marketing" },
    },
  ],
  people: [
    {
      id: "person-1",
      fullName: "Jane Smith",
      title: "Product manager",
      link: "/people/1",
    },
  ],
  discussions: [
    {
      id: "discussion-1",
      name: "Launch announcement",
      context: "Marketing",
      link: "/discussions/1",
    },
  ],
  folders: [{ id: "folder-1", name: "Research", context: "Product", link: "/folders/1" }],
  documents: [
    {
      id: "document-1",
      name: "Customer interviews",
      context: "Product",
      link: "/documents/1",
    },
  ],
  files: [{ id: "file-1", name: "Launch assets.zip", context: "Marketing", link: "/files/1" }],
  links: [{ id: "link-1", name: "Design prototype", context: "Website redesign", link: "/links/1" }],
};

const searchAllGroups: GlobalSearch.SearchFn = async () => allGroups;
const searchNothing: GlobalSearch.SearchFn = async () => ({});
const searchError: GlobalSearch.SearchFn = async () => {
  throw new Error("Quick search is unavailable");
};
const searchForever: GlobalSearch.SearchFn = () => new Promise(() => {});

async function openAndType(query: string) {
  const body = within(document.body);
  await userEvent.click(body.getByRole("button", { name: /search/i }));
  const input = body.getByRole("combobox");
  await userEvent.type(input, query);
  return { body, input };
}

export const AllGroups: Story = {
  args: {
    search: searchAllGroups,
  },
  play: async () => {
    const { body } = await openAndType("launch");
    const options = await body.findAllByRole("option");
    await expect(options).toHaveLength(11);
  },
};

export const Loading: Story = {
  args: {
    search: searchForever,
  },
  play: async () => {
    const { body } = await openAndType("launch");
    await expect(await body.findByText("Searching…")).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    search: searchNothing,
  },
  play: async () => {
    const { body } = await openAndType("missing");
    await expect(await body.findByText("No title or name matches for “missing”.")).toBeVisible();
  },
};

export const Error: Story = {
  args: {
    search: searchError,
  },
  play: async () => {
    const { body } = await openAndType("failure");
    await expect(await body.findByText("Quick search is unavailable.")).toBeVisible();
  },
};

export const LongNames: Story = {
  args: {
    search: async () => ({
      documents: [
        {
          id: "long-document",
          name: "A very long customer research synthesis title that must remain compact inside the quick-search overlay",
          context: "A resource hub with an intentionally long owner name that must also truncate",
          link: "/documents/long-document",
        },
      ],
    }),
  },
  play: async () => {
    const { body } = await openAndType("research");
    await expect(await body.findByRole("option")).toBeVisible();
  },
};

const scrollingResults: GlobalSearch.SearchResult = {
  ...allGroups,
  discussions: Array.from({ length: 5 }, (_, index) => ({
    id: `discussion-${index}`,
    name: `Discussion result ${index + 1}`,
    context: "Product",
    link: `/discussions/${index}`,
  })),
  folders: Array.from({ length: 5 }, (_, index) => ({
    id: `folder-${index}`,
    name: `Folder result ${index + 1}`,
    context: "Product",
    link: `/folders/${index}`,
  })),
  documents: Array.from({ length: 5 }, (_, index) => ({
    id: `document-${index}`,
    name: `Document result ${index + 1}`,
    context: "Product",
    link: `/documents/${index}`,
  })),
  files: Array.from({ length: 5 }, (_, index) => ({
    id: `file-${index}`,
    name: `File result ${index + 1}`,
    context: "Product",
    link: `/files/${index}`,
  })),
  links: Array.from({ length: 5 }, (_, index) => ({
    id: `link-${index}`,
    name: `Link result ${index + 1}`,
    context: "Product",
    link: `/links/${index}`,
  })),
};

export const ScrollingAndKeyboardNavigation: Story = {
  args: {
    search: async () => scrollingResults,
  },
  play: async () => {
    const { body, input } = await openAndType("result");
    await body.findByRole("listbox");
    await userEvent.type(input, "{arrowup}");
    await expect(body.getByRole("option", { selected: true })).toHaveTextContent("Link result 5");
  },
};
