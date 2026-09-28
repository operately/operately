import { useTranslation } from "react-i18next";
import React from "react";

import { Menu, MenuActionItem, MenuSeparator } from "../../Menu";
import { IconCheck, IconChevronDown, IconFlag, IconFlagFilled, IconList, IconPlus } from "../../icons";
import { MilestoneCreationModal } from "./MilestoneCreationModal";
import type { NewMilestonePayload } from "../types";

export type MilestoneViewSelectorMilestone = {
  id: string;
  name: string;
  status?: "pending" | "done";
};

type MilestoneCreationResult = {
  success?: boolean;
  milestone?: { id: string };
};

interface MilestoneViewSelectorProps {
  milestones: MilestoneViewSelectorMilestone[];
  selectedMilestone: MilestoneViewSelectorMilestone | null;
  canCreateMilestone: boolean;
  onChange: (milestoneId: string | null) => void;
  onCreateMilestone: (
    milestone: NewMilestonePayload,
  ) => void | MilestoneCreationResult | Promise<void | MilestoneCreationResult>;
}

export function MilestoneViewSelector({
  milestones,
  selectedMilestone,
  canCreateMilestone,
  onChange,
  onCreateMilestone,
}: MilestoneViewSelectorProps) {
  const { t } = useTranslation();
  const [isCreationModalOpen, setIsCreationModalOpen] = React.useState(false);
  const selectedLabel = selectedMilestone?.name ?? t("All project tasks");

  const createMilestone = async (milestone: NewMilestonePayload) => {
    const result = await Promise.resolve(onCreateMilestone(milestone));

    if (result && "success" in result && result.success && result.milestone) {
      onChange(result.milestone.id);
    }
  };

  return (
    <>
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="flex-shrink-0 font-medium text-content-dimmed">{t("Viewing tasks for")}</span>

        <Menu
          customTrigger={
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 rounded-md border border-surface-outline bg-surface-base px-3 py-1.5 font-medium text-content-base shadow-sm transition hover:bg-surface-dimmed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-outline"
              aria-label={t("Viewing tasks for {{milestone}}", { milestone: selectedLabel })}
              data-test-id="milestone-view-selector"
            >
              <MilestoneStatusIcon milestone={selectedMilestone} />
              <span className="truncate">{selectedLabel}</span>
              <IconChevronDown size={16} className="flex-shrink-0 text-content-dimmed" />
            </button>
          }
          size="small"
          align="start"
        >
          <MilestoneOption milestone={null} isSelected={selectedMilestone === null} onSelect={() => onChange(null)} />

          {milestones.map((milestone) => (
            <MilestoneOption
              key={milestone.id}
              milestone={milestone}
              isSelected={milestone.id === selectedMilestone?.id}
              onSelect={() => onChange(milestone.id)}
            />
          ))}

          {canCreateMilestone && (
            <>
              <MenuSeparator />
              <MenuActionItem
                icon={IconPlus}
                onClick={() => setIsCreationModalOpen(true)}
                testId="create-milestone-from-board"
              >
                {t("Create milestone")}
              </MenuActionItem>
            </>
          )}
        </Menu>
      </div>

      <MilestoneCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onCreateMilestone={createMilestone}
      />
    </>
  );
}

function MilestoneOption({
  milestone,
  isSelected,
  onSelect,
}: {
  milestone: MilestoneViewSelectorMilestone | null;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const label = milestone?.name ?? t("All project tasks");

  return (
    <MenuActionItem onClick={onSelect}>
      <span className="flex min-w-0 items-center justify-between gap-4">
        <span className="flex min-w-0 items-center gap-2">
          <MilestoneStatusIcon milestone={milestone} />
          <span className="truncate">{label}</span>
        </span>
        {isSelected && <IconCheck size={16} className="flex-shrink-0 text-content-base" />}
      </span>
    </MenuActionItem>
  );
}

function MilestoneStatusIcon({ milestone }: { milestone: MilestoneViewSelectorMilestone | null }) {
  if (!milestone) {
    return <IconList size={16} className="flex-shrink-0 text-content-dimmed" />;
  }

  if (milestone.status === "done") {
    return <IconFlagFilled size={16} className="flex-shrink-0 text-accent-1" />;
  }

  return <IconFlag size={16} className="flex-shrink-0 text-content-dimmed" />;
}
