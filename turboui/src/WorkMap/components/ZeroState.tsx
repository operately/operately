import React from "react";

import type { WorkMap } from "..";
import { PrimaryButton } from "../../Button";
import { SpaceField } from "../../SpaceField";
import { IconGoal, IconGrowth, IconProject } from "../../icons";
import { AddItemModal } from "./AddItemModal";

interface ZeroStateProps {
  addingEnabled: boolean;
  spaceSearch: SpaceField.SearchSpaceFn;
  addItem: WorkMap.AddNewItemFn;
  addItemDefaultSpace: SpaceField.Space;
  hideCompanyAccess?: boolean;
  zeroStateMessage?: string;
  variant?: WorkMap.EmptyStateVariant;
  onItemCreated?: WorkMap.ItemCreatedFn;
}

export function ZeroState(props: ZeroStateProps) {
  if (!props.addingEnabled) return <ZeroStateCannotAdd message={props.zeroStateMessage} />;
  if (props.variant === "first-project") return <FirstProjectZeroState {...props} />;

  return <ZeroStateCanAdd {...props} />;
}

function ZeroStateCannotAdd({ message }: { message?: string }) {
  return (
    <div className="py-12 relative">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center relative z-10">
        <IconGrowth size={60} className="text-lime-500 my-4" stroke={1} />
        Nothing here yet. <br />
        {message || "Assigned goals and projects will appear here."}
      </div>
    </div>
  );
}

export function ZeroStateCanAdd({ spaceSearch, addItem, addItemDefaultSpace, hideCompanyAccess }: ZeroStateProps) {
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
        hideCompanyAccess={Boolean(hideCompanyAccess)}
      />
    </div>
  );
}

function FirstProjectZeroState({ spaceSearch, addItem, addItemDefaultSpace, onItemCreated }: ZeroStateProps) {
  const [name, setName] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [goalModalOpen, setGoalModalOpen] = React.useState(false);

  const submitProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const projectName = name.trim();
    if (!projectName) {
      setNameError("Enter a project name.");
      return;
    }

    setNameError(null);
    setSubmitError(null);
    setSubmitting(true);

    try {
      const result = await addItem({
        name: projectName,
        type: "project",
        space: addItemDefaultSpace,
        parentId: null,
        accessLevels: { company: "edit", space: "edit" },
      });

      await onItemCreated?.("project", result.id);

      if (!onItemCreated) {
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      setSubmitError("The project could not be created. Try again.");
      setSubmitting(false);
    }
  };

  const inputError = nameError || submitError;

  return (
    <div className="px-4 py-12 sm:py-16" data-test-id="first-project-zero-state">
      <div className="mx-auto flex max-w-xs flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-balance text-xl font-semibold text-content-strong">Add your first project</h2>
          <p className="max-w-[42ch] text-pretty text-base text-content-dimmed sm:text-sm">
            Start with something already in motion. You can add tasks, milestones, and teammates next.
          </p>
        </div>

        <form className="flex w-full flex-col gap-3 text-left" onSubmit={submitProject}>
          <div className="flex flex-col gap-1">
            <label className="text-base font-medium text-content-accent sm:text-sm" htmlFor="first-project-name">
              Project name
            </label>
            <input
              autoFocus
              id="first-project-name"
              name="project-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Launch the new website"
              aria-describedby={inputError ? "first-project-error" : undefined}
              aria-invalid={Boolean(inputError)}
              className="w-full rounded-lg border border-surface-outline bg-surface-base px-3 py-2.5 text-base text-content-accent outline-none placeholder:text-content-subtle focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-brand-1 sm:py-2 sm:text-sm"
              data-test-id="first-project-name"
            />
            {inputError && (
              <p id="first-project-error" className="text-base text-content-error sm:text-sm" role="alert">
                {inputError}
              </p>
            )}
          </div>

          <PrimaryButton className="w-full" type="submit" size="sm" loading={submitting} testId="create-first-project">
            Create project
          </PrimaryButton>
        </form>

        <p className="text-pretty text-base text-content-dimmed sm:text-sm">
          Tracking an outcome instead?{" "}
          <button
            type="button"
            className="font-medium text-brand-1 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-1"
            onClick={() => setGoalModalOpen(true)}
            data-test-id="add-first-goal"
          >
            Add a goal
          </button>
          .
        </p>
      </div>

      <AddItemModal
        isOpen={goalModalOpen}
        close={() => setGoalModalOpen(false)}
        parentGoal={null}
        spaceSearch={spaceSearch}
        save={addItem}
        space={addItemDefaultSpace}
        initialItemType="goal"
        hideTypeSelector
        hideCreateMore
        keepOpenAfterSave={Boolean(onItemCreated)}
        onSaved={onItemCreated}
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
      data-test-id={testId}
    >
      {icon}

      <div className="mt-3">
        <h3 className="text-base font-semibold text-content-strong">{title}</h3>
        <p className="mt-1 text-sm text-content-dimmed leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
