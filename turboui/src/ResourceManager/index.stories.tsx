import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { ResourceManager } from "./index";

const meta: Meta<typeof ResourceManager> = {
  title: "Components/ResourceManager",
  component: ResourceManager,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockResources: ResourceManager.Resource[] = [
  {
    id: "resource-1",
    name: "Tasks Spreadsheet",
    url: "https://docs.google.com/spreadsheets/d/1234567890",
  },
  {
    id: "resource-2", 
    name: "Issue description",
    url: "https://github.com/company/repo/issues/123",
  },
  {
    id: "resource-3",
    name: "Project Slack Channel",
    url: "https://company.slack.com/channels/project-redesign",
  },
  {
    id: "resource-4",
    name: "Requirements Document",
    url: "https://docs.google.com/document/d/abc123",
  },
  {
    id: "resource-5",
    name: "",
    url: "https://example.com/unnamed-resource",
  },
];

export const Default: Story = {
  render: () => {
    const [resources, setResources] = useState<ResourceManager.Resource[]>([...mockResources]);

    const handleResourceAdd = (resource: ResourceManager.NewResourcePayload) => {
      const resourceId = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newResource = { id: resourceId, ...resource };
      console.log("Resource added:", newResource);
      setResources([...resources, newResource]);
    };

    const handleResourceEdit = (updates: ResourceManager.Resource) => {
      console.log("Resource edited:", updates);
      const updatedResources = resources.map((resource) =>
        resource.id === updates.id ? { ...resource, ...updates } : resource
      );
      setResources(updatedResources);
    };

    const handleResourceRemove = (id: string) => {
      console.log("Resource removed:", id);
      const updatedResources = resources.filter((resource) => resource.id !== id);
      setResources(updatedResources);
    };

    return (
      <div className="max-w-4xl">
        <ResourceManager
          resources={resources}
          onResourceAdd={handleResourceAdd}
          onResourceEdit={handleResourceEdit}
          onResourceRemove={handleResourceRemove}
          canEdit={true}
        />
      </div>
    );
  },
};

export const ReadOnly: Story = {
  render: () => {
    return (
      <div className="max-w-4xl">
        <ResourceManager
          resources={mockResources}
          onResourceAdd={() => {}}
          onResourceEdit={() => {}}
          onResourceRemove={() => {}}
          canEdit={false}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const [resources, setResources] = useState<ResourceManager.Resource[]>([]);

    const handleResourceAdd = (resource: ResourceManager.NewResourcePayload) => {
      const resourceId = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newResource = { id: resourceId, ...resource };
      console.log("Resource added:", newResource);
      setResources([...resources, newResource]);
    };

    const handleResourceEdit = (updates: ResourceManager.Resource) => {
      console.log("Resource edited:", updates);
      const updatedResources = resources.map((resource) =>
        resource.id === updates.id ? { ...resource, ...updates } : resource
      );
      setResources(updatedResources);
    };

    const handleResourceRemove = (id: string) => {
      console.log("Resource removed:", id);
      const updatedResources = resources.filter((resource) => resource.id !== id);
      setResources(updatedResources);
    };

    return (
      <div className="max-w-4xl">
        <ResourceManager
          resources={resources}
          onResourceAdd={handleResourceAdd}
          onResourceEdit={handleResourceEdit}
          onResourceRemove={handleResourceRemove}
          canEdit={true}
        />
      </div>
    );
  },
};

export const EmptyReadOnly: Story = {
  render: () => {
    return (
      <div className="max-w-4xl">
        <ResourceManager
          resources={[]}
          onResourceAdd={() => {}}
          onResourceEdit={() => {}}
          onResourceRemove={() => {}}
          canEdit={false}
        />
      </div>
    );
  },
};