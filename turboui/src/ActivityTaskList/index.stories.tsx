import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ActivityTaskList, type ActivityTaskListProps } from ".";
import { Avatar } from "../Avatar";
import { DivLink, Link } from "../Link";
import { FormattedTime } from "../FormattedTime";
import { Trans } from "../Translate";

const names = [
  "Triggers: Support pull request commit trigger",
  "Triggers: Support manual run trigger",
  "Triggers: Support scheduled trigger",
  "Tools: Support update task plan in MCP",
  "Triggers: Support webhook trigger",
  "Tools: Support add check in MCP",
  "Tools: Support move task in Bash",
  "Tools: Support move task in MCP",
  "Tools: Support close task in MCP",
  "Update Operately's Preview Env Deployment",
  "Tools: Support remove check in Bash",
  "Add personal stagings to SuperPlane",
  "Add scheduled tasks to SuperPlane",
  "Add manual visual evidence for SuperPlane",
  "Triggers: Support multiple triggers on one automation",
  "Publish the changelog entry and link the docs",
  "Record a video and post it in #ship",
  "Triggers: Support task entered column trigger",
  "Send the video and the docs to design partners",
  "Triggers: Support pull request opened trigger",
  "Triggers: Support task left column trigger",
  "Triggers: Support pull request closed trigger",
  "Tools: Support remove check in MCP",
  "Tools: Support close task in Bash",
  "Tools: Support add check in Bash",
  "Tools: Support remove artifact in MCP",
  "Tools: Support add artifact in MCP",
  "Tools: Support update task plan in Bash",
  "Tools: Support remove artifact in Bash",
  "Add automations to the intake column",
];
const tasks = names.map((name, index) => ({ key: `task-${index}`, name, path: `/tasks/task-${index}` }));

const meta = {
  title: "Components/ActivityTaskList",
  component: ActivityTaskList,
  args: { tasks, locale: "en" },
  render: (args) => <FeedExample {...args} />,
} satisfies Meta<typeof ActivityTaskList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ShortList: Story = { args: { tasks: tasks.slice(0, 3) } };
export const LargeList: Story = {};
export const DarkLargeList: Story = { globals: { theme: "dark" } };
export const ExpansionAndCollapse: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disclosure = canvas.getByRole("button");
    await expect(canvasElement.querySelectorAll('[data-test-id="activity-task-link"]')).toHaveLength(3);
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    disclosure.focus();
    await userEvent.keyboard("{Enter}");
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    await expect(canvasElement.querySelectorAll('[data-test-id="activity-task-link"]')).toHaveLength(30);
    await userEvent.keyboard(" ");
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await expect(canvasElement.querySelectorAll('[data-test-id="activity-task-link"]')).toHaveLength(3);
    await expect(disclosure).toHaveFocus();
  },
};

// Mirror Feed's row layout so wrapping, avatar, timestamp, and location can be reviewed together.
function FeedExample(props: ActivityTaskListProps) {
  const time = "2026-10-28T15:21:00Z";
  return (
    <div className="min-h-screen bg-surface-base text-content-base p-4 sm:p-8">
      <div className="w-full border-stroke-base flex flex-col sm:flex-row items-start gap-2 py-4">
        <div className="w-1/5 shrink-0 mb-2 text-sm text-content-accent font-bold whitespace-nowrap">
          <FormattedTime time={time} format="long-date" locale={props.locale} timezone="UTC" timeFormat="automatic" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div className="group flex flex-1 gap-3 items-center">
            <DivLink to="/people/igor">
              <Avatar person={{ id: "igor", fullName: "Igor" }} size="small" />
            </DivLink>
            <div className="w-full break-words -mt-0.5">
              <div className="text-sm font-bold text-content-accent">
                <Trans
                  i18nKey="{{author}} updated assignees on <tasks/> in <location>{{locationName}}</location>"
                  values={{ author: "Igor", locationName: "Custom automations" }}
                  components={{ tasks: <ActivityTaskList {...props} />, location: <Link to="/spaces/automations" /> }}
                />
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-xs text-content-dimmed whitespace-nowrap text-right">
              <FormattedTime
                time={time}
                format="time-only"
                locale={props.locale}
                timezone="UTC"
                timeFormat="automatic"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
