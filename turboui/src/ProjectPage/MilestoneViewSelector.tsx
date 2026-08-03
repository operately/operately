import React from "react";

import { Menu, MenuActionItem, MenuSeparator } from "../Menu";
import { IconCheck, IconChevronDown, IconPlus } from "../icons";
import { MilestoneCreationModal } from "../TaskBoard/components/MilestoneCreationModal";
import type { ProjectPage } from "./index";

interface MilestoneViewSelectorProps {
  milestones: ProjectPage.Milestone[];
  selectedMilestone: ProjectPage.Milestone | null;
  canCreateMilestone: boolean;
  onChange: (milestoneId: string | null) => void;
  onCreateMilestone: ProjectPage.State["onMilestoneCreate"];
}

export function MilestoneViewSelector({
  milestones,
  selectedMilestone,
  canCreateMilestone,
  onChange,
  onCreateMilestone,
}: MilestoneViewSelectorProps) {
  const [isCreationModalOpen, setIsCreationModalOpen] = React.useState(false);
  const selectedLabel = selectedMilestone?.name ?? "All project tasks";

  const createMilestone = async (milestone: ProjectPage.NewMilestonePayload) => {
    const result = await Promise.resolve(onCreateMilestone(milestone));

    if (result?.success && result.milestone) {
      onChange(result.milestone.id);
    }
  };

  return (
    <>
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="flex-shrink-0 font-medium text-content-dimmed">Viewing tasks for</span>

        <Menu
          customTrigger={
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 rounded-md border border-surface-outline bg-surface-base px-3 py-1.5 font-medium text-content-base shadow-sm transition hover:bg-surface-dimmed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-outline"
              aria-label={`Viewing tasks for ${selectedLabel}`}
              data-test-id="milestone-view-selector"
            >
              <span className="truncate">{selectedLabel}</span>
              <IconChevronDown size={16} className="flex-shrink-0 text-content-dimmed" />
            </button>
          }
          size="small"
          align="start"
        >
          <MilestoneOption
            label="All project tasks"
            isSelected={selectedMilestone === null}
            onSelect={() => onChange(null)}
          />

          {milestones.map((milestone) => (
            <MilestoneOption
              key={milestone.id}
              label={milestone.name}
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
                Create milestone
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
  label,
  isSelected,
  onSelect,
}: {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <MenuActionItem onClick={onSelect}>
      <span className="flex min-w-0 items-center justify-between gap-4">
        <span className="truncate">{label}</span>
        {isSelected && <IconCheck size={16} className="flex-shrink-0 text-content-base" />}
      </span>
    </MenuActionItem>
  );
}
