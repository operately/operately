import React from "react";

import { WorkMap } from "..";
import { SpaceField } from "../../SpaceField";
import { IconGoal, IconProject } from "../../icons";
import { AddItemModal } from "./AddItemModal";

interface ZeroStateProps {
  addingEnabled: boolean;
  spaceSearch: SpaceField.SearchSpaceFn;
  addItem: WorkMap.AddNewItemFn;
  addItemDefaultSpace: SpaceField.Space;
}

export function ZeroState({ addingEnabled, spaceSearch, addItem, addItemDefaultSpace }: ZeroStateProps) {
  if (!addingEnabled) {
    return (
      <tr>
        <td colSpan={7} className="py-32 text-center">
          <div className="mb-4">Nothing here yet.</div>
        </td>
      </tr>
    );
  }

  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    type: AddItemModal.ItemType;
  }>({
    isOpen: false,
    type: "goal",
  });

  const open = (type: AddItemModal.ItemType) => () => setModalState({ isOpen: true, type });
  const close = () => setModalState((state) => ({ ...state, isOpen: false }));

  return (
    <div className="py-12 relative">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center relative z-10">
        <h2 className="text-base font-semibold text-content-strong sm:text-xl">Start by adding a goal or project</h2>
        <p className="mt-2 text-content-dimmed">
          See what you and your team are working on, with progress and deadlines.
        </p>

        <div className="mt-8 grid w-full gap-4 sm:grid-cols-2 sm:gap-6">
          <ZeroStateCard
            icon={<IconGoal size={40} className="p-2 rounded-lg bg-red-50 dark:bg-red-900" />}
            title="Add a goal"
            description="Long-term outcomes you're working toward. Track overall progress and impact."
            onClick={open("goal")}
            testId="add-goal"
          />
          <ZeroStateCard
            icon={<IconProject size={40} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900" />}
            title="Add a project"
            description="Concrete steps and tasks with specific deliverables. Get things done."
            onClick={open("project")}
            testId="add-project"
          />
        </div>

        <p className="mt-8 text-xs text-content-dimmed sm:text-sm">
          Not sure? Start with a project - you can always set goals later.
        </p>
      </div>

      <AddItemModal
        isOpen={modalState.isOpen}
        close={close}
        parentGoal={null}
        spaceSearch={spaceSearch}
        save={addItem}
        space={addItemDefaultSpace}
        initialItemType={modalState.type}
        hideTypeSelector={true}
      />
    </div>
  );
}

function ZeroStateCard({
  icon,
  title,
  description,
  onClick,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <div
      className="h-full rounded-2xl border border-stroke-base bg-surface-base px-6 py-6 text-left shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer transition"
      onClick={onClick}
      data-testid={testId}
    >
      {icon}

      <div className="mt-3">
        <h3 className="text-base font-semibold text-content-strong">{title}</h3>
        <p className="mt-1 text-sm text-content-dimmed leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
