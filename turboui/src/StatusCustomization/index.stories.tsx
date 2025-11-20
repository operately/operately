import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StatusCustomizationModal, type StatusCustomizationStatus } from "./index";
import { PrimaryButton } from "../Button";
import { StatusSelectorV2 } from "../StatusSelectorV2";

const meta = {
  title: "Components/StatusCustomizationModal",
  component: StatusCustomizationModal,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof StatusCustomizationModal>;

export default meta;
type Story = StoryObj<typeof StatusCustomizationModal>;

const DEFAULT_STATUSES: StatusCustomizationStatus[] = [
  { id: "pending", value: "pending", label: "Not started", color: "dimmed", icon: "circleDashed" },
  { id: "progress", value: "in_progress", label: "In progress", color: "brand", icon: "circleDot" },
  { id: "qa", value: "qa", label: "QA", color: "brand", icon: "circleDot" },
  { id: "done", value: "done", label: "Done", color: "success", icon: "circleCheck" },
  { id: "canceled", value: "canceled", label: "Canceled", color: "danger", icon: "circleX" },
];

const StatusPreview = ({ statuses }: { statuses: StatusCustomizationStatus[] }) => {
  const options = React.useMemo(
    () =>
      statuses.map((status) => ({
        value: status.value ?? status.id,
        label: status.label,
        icon: status.icon,
        color: status.color,
      })),
    [statuses],
  );

  const [activeStatus, setActiveStatus] = React.useState(options[0]?.value ?? "");

  React.useEffect(() => {
    if (!options.some((option) => option.value === activeStatus)) {
      setActiveStatus(options[0]?.value ?? "");
    }
  }, [options, activeStatus]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-content-dimmed">Live preview</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const IconComponent = StatusSelectorV2.STATUS_ICON_COMPONENTS[option.icon];
          const colorClass = StatusSelectorV2.STATUS_COLOR_MAP[option.color].iconClass || "text-content-base";
          return (
            <span
              key={option.value}
              className="inline-flex items-center gap-2 rounded-full border border-surface-outline px-3 py-1 text-xs text-content-base bg-surface-base"
            >
              <IconComponent size={14} className={colorClass} />
              {option.label}
            </span>
          );
        })}
      </div>
      {options.length > 0 && (
        <div className="mt-2">
          <StatusSelectorV2
            statusOptions={options}
            status={activeStatus}
            onChange={setActiveStatus}
            showFullBadge
          />
        </div>
      )}
    </div>
  );
};

const Playground = ({ initialStatuses }: { initialStatuses: StatusCustomizationStatus[] }) => {
  const [workflowStatuses, setWorkflowStatuses] = React.useState(initialStatuses);
  const [isModalOpen, setModalOpen] = React.useState(true);

  return (
    <div className="flex flex-col gap-6 w-[420px]">
      <StatusPreview statuses={workflowStatuses} />

      <div>
        <PrimaryButton size="sm" onClick={() => setModalOpen(true)}>
          Customize statuses
        </PrimaryButton>
      </div>

      <StatusCustomizationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        statuses={workflowStatuses}
        onSave={(next) => {
          setWorkflowStatuses(next);
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <Playground initialStatuses={DEFAULT_STATUSES} />,
};

export const EmptyWorkflow: Story = {
  render: () => <Playground initialStatuses={[]} />,
};
