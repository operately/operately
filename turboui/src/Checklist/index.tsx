import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { IconGripVertical } from "../icons";
import { DragAndDropProvider, useDraggable, useDraggingAnimation, useDropZone } from "../utils/DragAndDrop";

import { useForm } from "react-hook-form";
import classNames from "../utils/classnames";
import { ChecklistItemState, State, useChecklistState } from "./useChecklistState";

import { Textfield } from "../forms/Textfield";
import { PieChart } from "../PieChart";
import { SwitchToggle } from "../SwitchToggle";
import { createTestId } from "../TestableElement";

export namespace Checklist {
  export type ChecklistItem = {
    id: string;
    name: string;
    completed: boolean;
    index: number;
    mode: "view" | "edit" | "delete";
  };

  export type AddChecklistItemFn = (inputs: { name: string }) => Promise<{
    success: boolean;
    id: string;
  }>;

  export type DeleteChecklistItemFn = (id: string) => Promise<boolean>;

  export type UpdateChecklistItemFn = (inputs: { itemId: string; name: string }) => Promise<boolean>;

  export type ToggleChecklistItemFn = (id: string, completed: boolean) => Promise<boolean>;
  export type UpdateChecklistItemIndexFn = (id: string, index: number) => Promise<boolean>;

  export interface Props {
    items: ChecklistItem[];
    canEdit: boolean;

    addItem: AddChecklistItemFn;
    deleteItem: DeleteChecklistItemFn;
    updateItem: UpdateChecklistItemFn;
    toggleItem: ToggleChecklistItemFn;
    updateItemIndex: UpdateChecklistItemIndexFn;

    sectionTitle?: string;
    sectionTitleBottomMargin?: string;
    togglable?: boolean;
  }

  export interface InternalProps {
    items: ChecklistItem[];

    showEditButton?: boolean;
    togglable?: boolean;

    addActive?: boolean;
    onAddActiveChange?: (active: boolean) => void;

    addItem: AddChecklistItemFn;
    deleteItem: DeleteChecklistItemFn;
    updateItem: UpdateChecklistItemFn;
    toggleItem: ToggleChecklistItemFn;
    updateItemIndex: UpdateChecklistItemIndexFn;
  }
}

export function Checklist(props: Checklist.Props) {
  const [addActive, setAddActive] = React.useState(false);
  const completedCount = props.items.filter((item) => item.completed).length;
  const totalCount = props.items.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const sectionTitle = props.sectionTitle || "Checklist";
  const sectionTitlBottomMargin = props.sectionTitleBottomMargin || "mb-3";
  const togglable = props.togglable ?? true;

  return (
    <div>
      <ChecklistSectionHeader
        title={sectionTitle}
        completionPercentage={completionPercentage}
        completedCount={completedCount}
        totalCount={totalCount}
        canEdit={props.canEdit}
        togglable={togglable}
        addActive={addActive}
        onAddClick={() => setAddActive(true)}
      />

      {Boolean(!addActive && props.items.length === 0) && (
        <div className="mt-1">
          <div className="text-content-dimmed text-sm">
            {props.canEdit
              ? "Create a checklist to track qualitative progress or binary outcomes."
              : "This goal doesn't have a checklist."}
          </div>
        </div>
      )}

      <div className={sectionTitlBottomMargin}>
        <ChecklistInternal
          items={props.items}
          showEditButton={props.canEdit}
          togglable={togglable}
          addActive={addActive}
          onAddActiveChange={setAddActive}
          addItem={props.addItem}
          deleteItem={props.deleteItem}
          updateItem={props.updateItem}
          toggleItem={props.toggleItem}
          updateItemIndex={props.updateItemIndex}
        />
      </div>
    </div>
  );
}

function ChecklistSectionHeader({
  completionPercentage,
  completedCount,
  totalCount,
  canEdit,
  togglable,
  addActive,
  onAddClick,
  title,
}: {
  completionPercentage: number;
  completedCount: number;
  totalCount: number;
  canEdit: boolean;
  togglable: boolean;
  addActive: boolean;
  onAddClick: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold">{title}</h2>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <PieChart size={20} slices={[{ percentage: completionPercentage, color: "var(--color-green-500)" }]} />
            <span className="text-sm text-content-dimmed">
              {completedCount}/{totalCount} completed ({completionPercentage}%)
            </span>
          </div>
        )}
        {canEdit && !addActive && togglable && (
          <SecondaryButton size="xxs" onClick={onAddClick} testId="add-checklist-item">
            Add
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}

function ChecklistInternal(props: Checklist.InternalProps) {
  const state = useChecklistState(props);

  const handleDrop = state.togglable ? state.reorder : () => false;

  return (
    <DragAndDropProvider onDrop={handleDrop}>
      <ChecklistItemList state={state} />
    </DragAndDropProvider>
  );
}

function ChecklistItemList({ state }: { state: State }) {
  const { ref } = useDropZone({ id: "checklist", dependencies: [state.items] });

  return (
    <div ref={ref} className="space-y-0">
      {state.items.map((item, index) => (
        <div key={item.id}>
          {index === 0 && <div className="h-2" />}
          <ChecklistItemCard state={state} item={item} />
          <div className="h-2" />
        </div>
      ))}

      {state.addActive && <ChecklistItemAdd state={state} />}
    </div>
  );
}

function ChecklistItemCard({ state, item }: { state: State; item: ChecklistItemState }) {
  if (item.mode === "view") {
    return <ChecklistItemView state={state} item={item} />;
  }

  if (item.mode === "edit") {
    return <ChecklistItemEdit state={state} item={item} />;
  }

  throw new Error(`Unknown mode: ${item.mode}`);
}

function ChecklistItemAdd({ state }: { state: State }) {
  const [createMore, setCreateMore] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: any) => {
    const result = await state.addItem({
      name: data.name,
    });

    if (result) {
      if (createMore) {
        reset();
      } else {
        state.cancelAdd();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    } else if (e.key === "Escape") {
      e.preventDefault();
      state.cancelAdd();
    }
  };

  return (
    <InlineModal index={100}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Textfield
          testId="checklist-item-name"
          label="Check"
          autoFocus
          placeholder="e.g. Sign the contract"
          error={errors.name?.message as string}
          onKeyDown={handleKeyDown}
          {...register("name", { required: "Can't be empty" })}
        />
        <div className="flex items-center mt-4">
          <SwitchToggle value={createMore} setValue={setCreateMore} label="Create more" />
          <div className="flex-1"></div>
          <div className="flex gap-2">
            <SecondaryButton size="xs" onClick={() => state.cancelAdd()} type="button" testId="cancel">
              Cancel
            </SecondaryButton>
            <PrimaryButton size="xs" type="submit" testId="save">
              Add Check
            </PrimaryButton>
          </div>
        </div>
      </form>
    </InlineModal>
  );
}

function ChecklistItemEdit({ state, item }: { state: State; item: ChecklistItemState }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: item.name,
    },
  });

  const onSubmit = (data: any) => {
    state.saveEdit(item.id, {
      name: data.name,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <InlineModal index={item.index}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Textfield
          label="Check"
          error={errors.name?.message as string}
          onKeyDown={handleKeyDown}
          {...register("name", { required: "Can't be empty" })}
        />
        <div className="flex items-center gap-2 justify-end mt-4">
          <SecondaryButton size="xs" onClick={() => state.cancelEdit(item.id)} type="button">
            Cancel
          </SecondaryButton>
          <PrimaryButton size="xs" type="submit" testId="save">
            Save
          </PrimaryButton>
        </div>
      </form>
    </InlineModal>
  );
}

function InlineModal({ index, children }: { index: number; children: React.ReactNode }) {
  const outerClass = "border-b border-stroke-base";

  const innerClass = classNames("border border-surface-outline rounded-lg p-8 px-6 shadow-lg", {
    "mb-4": index === 0,
    "my-4": index !== 0,
  });

  return (
    <div className={outerClass}>
      <div className={innerClass}>{children}</div>
    </div>
  );
}

function ChecklistItemView({ state, item }: { state: State; item: ChecklistItemState }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { itemStyle } = useDraggingAnimation("checklist", state.items);

  const { ref, isDragging } = useDraggable({
    id: item.id,
    zoneId: "checklist",
  });

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.togglable) {
      state.toggleItem(item.id, !item.completed);
    }
  };

  const undraggedStyle = itemStyle(item.id);
  const draggedStyle = { background: "var(--color-surface-base)" };

  const dragGripClass = classNames(
    "absolute -left-5 mt-0.5 text-content-subtle opacity-0 group-hover:opacity-100 transition-all",
    {
      "cursor-grab": !isDragging && state.togglable,
      "cursor-grabbing": isDragging && state.togglable,
      "opacity-100": isDragging && state.togglable,
      hidden: !state.togglable,
    },
  );

  const groupClass = classNames("group relative flex items-start gap-2 rounded", {
    "hover:bg-surface-highlight transition-colors": state.togglable,
  });

  return (
    <div
      className={groupClass}
      ref={ref}
      style={isDragging ? draggedStyle : undraggedStyle}
      data-test-id={createTestId("checklist-item", item.name)}
    >
      <IconGripVertical size={16} className={dragGripClass} />
      <ChecklistItemCheckbox item={item} onClick={handleCheckboxChange} togglable={state.togglable} />
      <ChecklistItemName item={item} />
      {item.editButtonVisible && state.togglable && (
        <ChecklistItemEditButton state={state} item={item} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      )}
    </div>
  );
}

function ChecklistItemName({ item }: { item: ChecklistItemState }) {
  const className = classNames("flex-1 font-medium", {
    "line-through text-content-dimmed": item.completed,
  });

  return <div className={className}>{item.name}</div>;
}

function ChecklistItemCheckbox({
  item,
  onClick,
  togglable = true,
}: {
  item: ChecklistItemState;
  onClick: (e: React.MouseEvent) => void;
  togglable?: boolean;
}) {
  const buttonClassName = classNames(
    "w-5 h-5 mt-0.5 border border-surface-outline rounded flex items-center justify-center flex-shrink-0",
    {
      "hover:bg-surface-base transition-colors cursor-pointer": togglable,
      "opacity-50": !togglable,
    },
  );

  return (
    <button
      onClick={onClick}
      className={buttonClassName}
      disabled={!togglable}
      data-test-id={createTestId("checkbox", item.name)}
    >
      {item.completed && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M10 3L4.5 8.5L2 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function ChecklistItemEditButton({
  state,
  item,
  isMenuOpen,
  setIsMenuOpen,
}: {
  state: State;
  item: ChecklistItemState;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}) {
  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity relative">
      <button
        className="menu-button p-1.5 text-content-dimmed hover:text-content-base hover:bg-surface-dimmed rounded-full"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        data-test-id={createTestId("checklist-item-menu", item.id)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3" r="1" fill="currentColor" />
          <circle cx="8" cy="8" r="1" fill="currentColor" />
          <circle cx="8" cy="13" r="1" fill="currentColor" />
        </svg>
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-surface-base rounded-md shadow-lg ring-1 ring-surface-outline py-1 w-20">
            <button
              className="block w-full text-left px-3 py-1 text-sm text-content-dimmed hover:bg-surface-highlight hover:text-content-base"
              onClick={() => {
                state.startEdit(item.id);
                setIsMenuOpen(false);
              }}
              data-test-id="edit"
            >
              Edit
            </button>
            <button
              className="block w-full text-left px-3 py-1 text-sm text-content-error hover:bg-surface-highlight"
              onClick={() => {
                state.deleteItem(item.id);
                setIsMenuOpen(false);
              }}
              data-test-id="delete"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
