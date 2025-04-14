import type { Meta, StoryObj } from "@storybook/react";
import { ResourceName } from ".";
import { StatusBadge } from "../StatusBadge";
import { ResourceNameSize } from "./types";

const meta = {
  title: "Components/ResourceName",
  component: ResourceName,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      description: "The type of resource",
      options: ["goal", "project"],
      control: { type: "radio" },
    },
    name: {
      description: "The name of the resource",
      control: { type: "text" },
    },
    href: {
      description: "The URL to navigate to when clicked",
      control: { type: "text" },
    },
    isCompleted: {
      description: "Whether the resource is completed",
      control: { type: "boolean" },
    },
    isFailed: {
      description: "Whether the resource is failed",
      control: { type: "boolean" },
    },
    isDropped: {
      description: "Whether the resource is dropped",
      control: { type: "boolean" },
    },
    isPending: {
      description: "Whether the resource is pending",
      control: { type: "boolean" },
    },
    size: {
      description: "The size of the resource name",
      options: ["sm", "base", "lg"],
      control: { type: "radio" },
    },
  },
} satisfies Meta<typeof ResourceName>;

export default meta;
type Story = StoryObj<typeof ResourceName>;

/**
 * ResourceName components are used to display a resource (goal or project) with an icon and name.
 * The component handles different visual states based on the resource status.
 */
export const Default: Story = {
  render: (attrs) => (
    <div className="flex items-center p-4">
      <ResourceName {...attrs} />
    </div>
  ),

  args: {
    type: "goal",
    name: "Improve Customer Satisfaction",
    href: "#",
    size: "base",
  },
};

/**
 * ResourceName components can represent either goals or projects, each with its own icon and color scheme.
 */
export const Types: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">Goal</h3>
        <div className="flex items-center">
          <ResourceName 
            type="goal" 
            name="Increase Revenue by 20%" 
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">Project</h3>
        <div className="flex items-center">
          <ResourceName 
            type="project" 
            name="Website Redesign" 
          />
        </div>
      </div>
    </div>
  ),

};

/**
 * ResourceName components come in three sizes: small, base (default), and large.
 */
export const Sizes: Story = {
  render: () => {
    const sizes: { name: string; value: ResourceNameSize }[] = [
      { name: "Small", value: "sm" },
      { name: "Base", value: "base" },
      { name: "Large", value: "lg" },
    ];

    return (
      <div className="grid grid-cols-1 gap-6">
        {sizes.map((size) => (
          <div key={size.value} className="p-4">
            <h3 className="text-lg font-medium mb-4">{size.name}</h3>
            <div className="flex items-center">
              <ResourceName 
                type="goal" 
                name="Improve Customer Satisfaction" 
                size={size.value} 
              />
            </div>
          </div>
        ))}
      </div>
    );
  },

};

/**
 * ResourceName components can display different states of a resource.
 */
export const States: Story = {
  render: () => {
    const states = [
      { name: "Default", props: {} },
      { name: "Completed", props: { isCompleted: true } },
      { name: "Failed", props: { isFailed: true } },
      { name: "Dropped", props: { isDropped: true } },
      { name: "Pending", props: { isPending: true } },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {states.map((state, index) => (
          <div key={index} className="p-4">
            <h3 className="text-lg font-medium mb-4">{state.name}</h3>
            <div className="flex items-center">
              <ResourceName 
                type="goal" 
                name="Improve Customer Satisfaction" 
                {...state.props} 
              />
            </div>
          </div>
        ))}
      </div>
    );
  },

};

/**
 * Examples of ResourceName components in a dark theme context.
 */
export const DarkTheme: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-800 p-6 rounded">
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4 text-white">Goal</h3>
        <div className="flex items-center">
          <ResourceName 
            type="goal" 
            name="Increase Revenue by 20%" 
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4 text-white">Project</h3>
        <div className="flex items-center">
          <ResourceName 
            type="project" 
            name="Website Redesign" 
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: "dark" },
  },
};

/**
 * Examples of ResourceName components in a list context.
 */
export const InList: Story = {
  parameters: {
    layout: "padded",
    backgrounds: { default: "light" },
  },
  render: () => (
    <div className="p-4">
      <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg" style={{ width: "100%", maxWidth: "600px", margin: "auto" }}>
      <div className="bg-gray-50 p-4 border-b border-gray-200 font-medium text-gray-700 flex items-center">
        <span className="text-blue-500 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </span>
        Resources
      </div>
      <ul className="divide-y divide-gray-200 bg-white">
        <li className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ResourceName 
                type="goal" 
                name="Increase Revenue by 20%" 
              />
            </div>
            <StatusBadge status="on_track" />
          </div>
        </li>
        <li className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ResourceName 
                type="project" 
                name="Website Redesign" 
              />
            </div>
            <StatusBadge status="on_track" />
          </div>
        </li>
        <li className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ResourceName 
                type="goal" 
                name="Improve Customer Satisfaction" 
                isCompleted={true}
              />
            </div>
            <StatusBadge status="completed" />
          </div>
        </li>
        <li className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ResourceName 
                type="project" 
                name="Mobile App Development" 
                isPending={true}
              />
            </div>
            <StatusBadge status="pending" />
          </div>
        </li>
        <li className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ResourceName 
                type="goal" 
                name="Expand to New Markets" 
                isDropped={true}
              />
            </div>
            <StatusBadge status="dropped" />
          </div>
        </li>
      </ul>
      </div>
    </div>
  ),

};
