import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProjectPage } from ".";
import { Default } from "./index.stories";

const meta = {
  title: "Pages/ProjectPage/Content tabs",
  component: ProjectPage,
  parameters: { layout: "fullscreen" },
  render: Default.render,
} satisfies Meta<typeof ProjectPage>;
export default meta;
type Story = Omit<StoryObj<typeof meta>, "args"> & { args?: Partial<ProjectPage.Props> };
const tab = (name: string) => ({
  reactRouter: { path: `/projects/project-1?tab=${name}`, routePath: "/projects/:id" },
});

export const CheckInsLoading: Story = { parameters: tab("check-ins"), args: { checkIns: [], checkInsLoading: true } };
export const DiscussionsLoading: Story = {
  parameters: tab("discussions"),
  args: { discussions: [], discussionsLoading: true },
};
export const CheckInsError: Story = {
  parameters: tab("check-ins"),
  args: { checkIns: [], checkInsError: true, onRetryCheckIns: () => console.log("Retry check-ins") },
};
export const DiscussionsError: Story = {
  parameters: tab("discussions"),
  args: { discussions: [], discussionsError: true, onRetryDiscussions: () => console.log("Retry discussions") },
};

export const TasksLoading: Story = { parameters: tab("tasks"), args: { tasks: [], tasksLoading: true } };
export const TasksError: Story = {
  parameters: tab("tasks"),
  args: { tasks: [], tasksError: true, onRetryTasks: () => console.log("Retry tasks") },
};

export const DocsAndFilesLoading: Story = {
  parameters: tab("docs-and-files"),
  args: { docsAndFiles: undefined, docsAndFilesAvailable: true, docsAndFilesLoading: true },
};
export const DocsAndFilesError: Story = {
  parameters: tab("docs-and-files"),
  args: {
    docsAndFiles: undefined,
    docsAndFilesAvailable: true,
    docsAndFilesError: true,
    onRetryDocsAndFiles: () => console.log("Retry docs and files"),
  },
};
