import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ResourceLink } from "./index";
import { ResourceManager } from "../ResourceManager";

const meta: Meta<typeof ResourceLink> = {
  title: "Components/ResourceLink",
  component: ResourceLink,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-surface-base min-w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleResource: ResourceManager.Resource = {
  id: "1",
  name: "Product Requirements Document",
  url: "https://docs.google.com/document/d/example",
  type: "google_doc",
};

export const Default: Story = {
  render: () => {
    const [resource, setResource] = React.useState(sampleResource);

    return (
      <ResourceLink
        resource={resource}
        canEdit={true}
        onEdit={(updates) => {
          console.log("Edit resource:", updates);
          setResource((prev) => ({ ...prev, ...updates }));
        }}
        onRemove={(id) => console.log("Remove:", id)}
      />
    );
  },
};

export const ReadOnly: Story = {
  args: {
    resource: sampleResource,
    canEdit: false,
  },
};

export const LongTitle: Story = {
  args: {
    resource: {
      ...sampleResource,
      name: "This is a very long resource title that should be truncated to fit in the component",
    },
    canEdit: true,
    onEdit: (id, resource) => console.log("Edit:", id, resource),
    onRemove: (id) => console.log("Remove:", id),
  },
};

export const NoTitle: Story = {
  args: {
    resource: {
      ...sampleResource,
      name: "",
    },
    canEdit: true,
    onEdit: (id, resource) => console.log("Edit:", id, resource),
    onRemove: (id) => console.log("Remove:", id),
  },
};


export const MultipleResources: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ResourceLink
        resource={{
          id: "1",
          name: "GitHub Repository",
          url: "https://github.com/example/repo",
          type: "github",
        }}
        canEdit={true}
        onEdit={(resource) => console.log("Edit:", resource)}
        onRemove={(id) => console.log("Remove:", id)}
      />
      <ResourceLink
        resource={{
          id: "2",
          name: "Slack Channel",
          url: "https://slack.com/channels/example",
          type: "slack",
        }}
        canEdit={true}
        onEdit={(resource) => console.log("Edit:", resource)}
        onRemove={(id) => console.log("Remove:", id)}
      />
      <ResourceLink
        resource={{
          id: "3",
          name: "",
          url: "https://sheets.google.com/example",
          type: "google_sheet",
        }}
        canEdit={true}
        onEdit={(resource) => console.log("Edit:", resource)}
        onRemove={(id) => console.log("Remove:", id)}
      />
    </div>
  ),
};
