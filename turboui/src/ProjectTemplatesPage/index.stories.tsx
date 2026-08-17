import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ProjectTemplate } from "../ApiTypes";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { ProjectTemplatesPage } from ".";

const spaces = [
  { id: "marketing", name: "Marketing", link: "/spaces/marketing" },
  { id: "product", name: "Product", link: "/spaces/product" },
];

const templates: ProjectTemplate[] = [
  mockTemplate("campaign", "Campaign launch", spaces[0]!, 4, 18),
  mockTemplate("event", "Customer event", spaces[0]!, 3, 12),
  mockTemplate("release", "Product release", spaces[1]!, 5, 24),
];

function mockTemplate(
  id: string,
  name: string,
  space: (typeof spaces)[number],
  milestoneCount: number,
  taskCount: number,
): ProjectTemplate {
  return {
    __typename: "project_template",
    id,
    name,
    description: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "A reusable plan for repeatable work." }] }],
    }),
    space: { __typename: "space", id: space.id, name: space.name },
    creator: {
      __typename: "person",
      id: "person",
      fullName: "Ada Lovelace",
      title: "Engineer",
      avatarUrl: null,
      email: "ada@example.com",
      type: "member",
    },
    insertedAt: "2026-07-01T12:00:00Z",
    updatedAt: "2026-08-01T12:00:00Z",
    milestoneCount,
    taskCount,
    inactivePeopleSummary: { personCount: 0, roleCount: 0, taskCount: 0 },
    inactiveDiscussionCount: 0,
  };
}

function StoryPage(props: Partial<ProjectTemplatesPage.Props>) {
  return (
    <ProjectTemplatesPage
      scope="company"
      navigation={[{ to: "/home", label: "Home" }]}
      templates={props.templates ?? templates}
      spaces={spaces}
      editableSpaces={spaces}
      canCreate
      templatePath={(id) => `/project-templates/${id}`}
      projectCreationPath={(template) => `/projects/new?spaceId=${template.space.id}&templateId=${template.id}`}
      spaceTemplatesPath={(id) => `/spaces/${id}/project-templates`}
      onCreate={async () => ({ success: true })}
      canEdit={() => true}
      onDuplicate={async () => ({ success: true })}
      onArchive={async () => ({ success: true })}
      onRestore={async () => ({ success: true })}
      onDelete={async () => ({ success: true })}
      formattedTimePreferences={defaultFormattedTimePreferences}
      {...props}
    />
  );
}

const meta = {
  title: "Pages/ProjectTemplatesPage",
  component: ProjectTemplatesPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProjectTemplatesPage>;
export default meta;
type Story = Omit<StoryObj<typeof meta>, "args"> & {
  args?: StoryObj<typeof meta>["args"];
};

export const CompanyLibrary: Story = { render: () => <StoryPage /> };
export const SpaceLibrary: Story = {
  render: () => (
    <StoryPage
      scope="space"
      navigation={[{ to: spaces[0]!.link, label: spaces[0]!.name }]}
      fixedSpace={spaces[0]}
      templates={templates.slice(0, 2)}
    />
  ),
};
export const Empty: Story = { render: () => <StoryPage templates={[]} /> };
export const ReadOnly: Story = { render: () => <StoryPage canCreate={false} /> };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile1" } }, render: () => <StoryPage /> };
