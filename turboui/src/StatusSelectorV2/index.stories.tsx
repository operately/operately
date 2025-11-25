import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Page } from "../Page";
import { StatusSelectorV2 } from "./index";

/**
 * StatusSelectorV2 is a component that allows users to select and display status values:
 * - Supports custom status workflows (engineering, marketing, support, etc.)
 * - Shows status with icon and label
 * - Can be configured as read-only or editable
 * - Offers multiple size variants: sm, md, lg
 * - Supports full badge display mode
 */
const meta: Meta<typeof StatusSelectorV2> = {
  title: "Components/StatusSelectorV2",
  component: StatusSelectorV2,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StatusSelectorV2>;

export default meta;
type Story = StoryObj<typeof meta>;

const engineeringStatuses = [
  { id: "backlog", value: "backlog", label: "Backlog", icon: "circleDashed", color: "dimmed", index: 0 },
  {
    id: "ready_for_dev",
    value: "ready_for_dev",
    label: "Ready for development",
    icon: "circleDashed",
    color: "dimmed",
    index: 1,
  },
  { id: "in_progress", value: "in_progress", label: "In progress", icon: "circleDot", color: "brand", index: 2 },
  { id: "code_review", value: "code_review", label: "Code review", icon: "circleDot", color: "brand", index: 3 },
  { id: "qa", value: "qa", label: "In QA", icon: "circleDot", color: "brand", index: 4 },
  {
    id: "shipped",
    value: "shipped",
    label: "Shipped",
    icon: "circleCheck",
    buttonIcon: "check",
    color: "success",
    buttonVariant: "success",
    index: 5,
  },
  {
    id: "canceled",
    value: "canceled",
    label: "Canceled",
    icon: "circleX",
    color: "dimmed",
    buttonVariant: "muted",
    index: 6,
  },
] as const satisfies ReadonlyArray<StatusSelectorV2.StatusOption>;

const marketingStatuses = [
  { id: "brief", value: "brief", label: "Creative brief", icon: "circleDashed", color: "dimmed", index: 0 },
  { id: "drafting", value: "drafting", label: "Drafting content", icon: "circleDot", color: "brand", index: 1 },
  { id: "approvals", value: "approvals", label: "Stakeholder review", icon: "circleDot", color: "brand", index: 2 },
  { id: "scheduled", value: "scheduled", label: "Scheduled", icon: "circleDot", color: "brand", index: 3 },
  {
    id: "launched",
    value: "launched",
    label: "Launched",
    icon: "circleCheck",
    buttonIcon: "check",
    color: "success",
    buttonVariant: "success",
    index: 4,
  },
  {
    id: "archived",
    value: "archived",
    label: "Archived",
    icon: "circleX",
    color: "dimmed",
    buttonVariant: "muted",
    index: 5,
  },
] as const satisfies ReadonlyArray<StatusSelectorV2.StatusOption>;

const supportStatuses = [
  { id: "new", value: "new", label: "New ticket", icon: "circleDashed", color: "dimmed", index: 0 },
  { id: "triage", value: "triage", label: "Triage", icon: "circleDot", color: "brand", index: 1 },
  {
    id: "waiting_customer",
    value: "waiting_customer",
    label: "Waiting on customer",
    icon: "circleDashed",
    color: "dimmed",
    index: 2,
  },
  { id: "escalated", value: "escalated", label: "Escalated", icon: "circleDot", color: "brand", index: 3 },
  {
    id: "resolved",
    value: "resolved",
    label: "Resolved",
    icon: "circleCheck",
    buttonIcon: "check",
    color: "success",
    buttonVariant: "success",
    index: 4,
  },
  {
    id: "closed",
    value: "closed",
    label: "Closed",
    icon: "circleX",
    color: "dimmed",
    buttonVariant: "muted",
    index: 5,
  },
] as const satisfies ReadonlyArray<StatusSelectorV2.StatusOption>;

const Component = (
  args: { statusOptions: ReadonlyArray<StatusSelectorV2.StatusOption> } & Partial<
    Omit<React.ComponentProps<typeof StatusSelectorV2>, "statusOptions" | "status" | "onChange">
  > & { status?: StatusSelectorV2.StatusOption["value"] },
) => {
  const [status, setStatus] = React.useState<StatusSelectorV2.StatusOption["value"]>(args.status || "");
  return <StatusSelectorV2 {...args} statusOptions={args.statusOptions} status={status} onChange={setStatus} />;
};

export const AllStates: Story = {
  render: () => {
    return (
      <Page title="StatusSelectorV2 All States" size="medium">
        <div className="space-y-12 p-12">
          <div>
            <h2 className="text-lg font-bold mb-8">Display Modes</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Icon Only (Default)</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" showFullBadge={false} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Full Badge</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" showFullBadge={true} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Full Badge - Success</h3>
                <Component statusOptions={engineeringStatuses} status="shipped" showFullBadge={true} />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Size Variants</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Small Size</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" size="sm" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Medium Size (Default)</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" size="md" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Large Size</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" size="lg" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Small + Full Badge</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" size="sm" showFullBadge />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Medium + Full Badge</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" size="md" showFullBadge />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Large + Full Badge</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" size="lg" showFullBadge />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Read-Only Mode</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only - Icon Only</h3>
                <StatusSelectorV2
                  statusOptions={engineeringStatuses}
                  status="in_progress"
                  onChange={() => undefined}
                  readonly
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only - Full Badge</h3>
                <StatusSelectorV2
                  statusOptions={engineeringStatuses}
                  status="in_progress"
                  onChange={() => undefined}
                  showFullBadge
                  readonly
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only - Success</h3>
                <StatusSelectorV2
                  statusOptions={engineeringStatuses}
                  status="shipped"
                  onChange={() => undefined}
                  showFullBadge
                  readonly
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Status Colors</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Dimmed</h3>
                <Component statusOptions={engineeringStatuses} status="backlog" showFullBadge />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Brand</h3>
                <Component statusOptions={engineeringStatuses} status="in_progress" showFullBadge />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Success</h3>
                <Component statusOptions={engineeringStatuses} status="shipped" showFullBadge />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Examples</h2>

            <div className="mb-8">
              <h3 className="text-base font-bold mb-4">Engineering Workflow</h3>
              <Component statusOptions={engineeringStatuses} status="in_progress" showFullBadge />
            </div>

            <div className="mb-8">
              <h3 className="text-base font-bold mb-4">Marketing Campaign Workflow</h3>
              <Component statusOptions={marketingStatuses} status="drafting" showFullBadge />
            </div>

            <div>
              <h3 className="text-base font-bold mb-4">Support Ticket Workflow</h3>
              <Component statusOptions={supportStatuses} status="triage" showFullBadge />
            </div>
          </div>
        </div>
      </Page>
    );
  },
};
