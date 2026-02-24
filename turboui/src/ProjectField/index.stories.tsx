import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
import { ProjectField } from "./index";

/**
 * ProjectField is a component for displaying and selecting a project within a popover interface.
 * Key features:
 * - Displays project icon and name when a project is assigned
 * - Shows placeholder state when no project is selected
 * - Supports different icon sizes and variants (inline/form-field)
 * - Includes search functionality for projects
 * - Supports readonly mode to disable interactions
 * - Uses Radix UI Popover for selection functionality
 */
const meta = {
  title: "Components/Fields/ProjectField",
  component: ProjectField,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    project: { control: "object" },
    iconSize: { control: "number" },
    readonly: { control: "boolean" },
    variant: {
      control: "select",
      options: ["inline", "form-field"],
    },
  },
} satisfies Meta<typeof ProjectField>;

export default meta;
type Story = StoryObj<typeof meta>;

const project = { id: "1", name: "Website Redesign", link: "#" };
const projects = [
  { id: "1", name: "Website Redesign", link: "#" },
  { id: "2", name: "Mobile App", link: "#" },
  { id: "3", name: "API Development", link: "#" },
  { id: "4", name: "Infrastructure", link: "#" },
  { id: "5", name: "Documentation", link: "#" },
  { id: "6", name: "Enterprise Customer Portal Redesign and Migration Initiative", link: "#" },
  { id: "7", name: "Advanced Machine Learning Model Training and Deployment Pipeline", link: "#" },
  { id: "8", name: "Global Data Center Optimization and Redundancy Implementation", link: "#" },
];

const search = async ({ query }: { query: string }) => {
  if (!query) return projects;
  return projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
};

const setProjectFn = (project: ProjectField.Project | null) => {
  console.log("Setting project:", project);
};

const ComponentWrapper = (args: Partial<ProjectField.Props>) => {
  const [project, setProject] = React.useState<ProjectField.Project | null>(args.project || null);
  return <ProjectField {...args} project={project} setProject={setProject} search={search} />;
};

const Label = ({ children }: { children: React.ReactNode }) => <div className="text-sm font-bold mb-2">{children}</div>;

/**
 * Demonstrates all possible states of the ProjectField component
 */
export const AllStates: Story = {
  parameters: {
    docs: {
      story: { inline: true },
    },
  },
  args: {
    project,
    setProject: setProjectFn,
    search,
  },
  render: () => {
    return (
      <Page title="ProjectField All States" size="medium">
        <div className="space-y-12 p-12">
          <div>
            <h2 className="text-lg font-bold mb-8">Inline Variant (Default)</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <Label>Normal</Label>
                <ComponentWrapper project={project} variant="inline" />
              </div>

              <div>
                <Label>Empty</Label>
                <ComponentWrapper project={null} variant="inline" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Form-Field Variant</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <Label>Normal</Label>
                <ComponentWrapper project={project} variant="form-field" />
              </div>

              <div>
                <Label>Empty</Label>
                <ComponentWrapper project={null} variant="form-field" />
              </div>

              <div>
                <ComponentWrapper project={null} variant="form-field" label="With Label" />
              </div>

              <div>
                <ComponentWrapper
                  project={null}
                  variant="form-field"
                  label="With Label and Error"
                  error="This is an error"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Custom Width</h2>
            <div className="space-y-6">
              <div>
                <Label>Inline - 200px width</Label>
                <ComponentWrapper project={project} variant="inline" width="200px" />
              </div>

              <div>
                <Label>Inline - 300px width</Label>
                <ComponentWrapper project={project} variant="inline" width="300px" />
              </div>

              <div>
                <Label>Form-Field - 250px width</Label>
                <ComponentWrapper project={project} variant="form-field" width="250px" label="Custom Width" />
              </div>

              <div>
                <Label>Form-Field - 400px width</Label>
                <ComponentWrapper project={project} variant="form-field" width="400px" label="Custom Width" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Long Project Names (Truncated)</h2>
            <div className="space-y-6">
              <div>
                <Label>Inline - Long name with 250px width</Label>
                <ComponentWrapper
                  project={projects[6]}
                  variant="inline"
                  width="250px"
                />
              </div>

              <div>
                <Label>Form-Field - Long name with 300px width</Label>
                <ComponentWrapper
                  project={projects[7]}
                  variant="form-field"
                  width="300px"
                  label="Long Project Name"
                />
              </div>

              <div>
                <Label>Form-Field - Long name with default width</Label>
                <ComponentWrapper
                  project={projects[6]}
                  variant="form-field"
                  label="Long Project Name"
                />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};

