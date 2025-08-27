import React from "react";

import { WorkMap } from "..";
import { PrimaryButton } from "../../Button";
import { SpaceField } from "../../SpaceField";
import { Tooltip } from "../../Tooltip";
import { IconInfoCircle, IconPlus } from "../../icons";
import classNames from "../../utils/classnames";
import { WorkMapExpandableProvider } from "../context/Expandable";
import { AddItemModal } from "./AddItemModal";
import { TableRow } from "./TableRow";

interface Props {
  items: WorkMap.Item[];
  addingEnabled?: boolean;
  tab: WorkMap.Filter;
  columnOptions?: WorkMap.ColumnOptions;
  addItem?: WorkMap.AddNewItemFn;
  spaceSearch?: SpaceField.SearchSpaceFn;
  addItemDefaultSpace?: SpaceField.Space;
}

export function WorkMapTable({
  items,
  tab,
  columnOptions = {},
  addItem,
  addingEnabled = false,
  spaceSearch,
  addItemDefaultSpace,
}: Props) {
  const emptyWorkMap = items.length === 0;
  const showIndentation = React.useMemo(() => items.some((item) => item.children.length > 0), [items]);

  return (
    <WorkMapExpandableProvider items={items}>
      <div className="overflow-x-auto bg-surface-base rounded-b-lg">
        <table className="min-w-full divide-y divide-surface-outline">
          <TableHeader tab={tab} columnOptions={columnOptions} />
          <tbody>
            {emptyWorkMap ? (
              <ZeroState
                addingEnabled={addingEnabled}
                spaceSearch={spaceSearch!}
                addItem={addItem!}
                addItemDefaultSpace={addItemDefaultSpace!}
              />
            ) : (
              <>
                {items.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    item={item}
                    level={0}
                    isLast={idx === items.length - 1}
                    tab={tab}
                    columnOptions={columnOptions}
                    showIndentation={showIndentation}
                    addItem={addItem}
                    addingEnabled={addingEnabled}
                    spaceSearch={spaceSearch}
                  />
                ))}

                {addingEnabled && (
                  <AddNewRow
                    addingEnabled={addingEnabled}
                    spaceSearch={spaceSearch!}
                    addItem={addItem!}
                    addItemDefaultSpace={addItemDefaultSpace!}
                  />
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </WorkMapExpandableProvider>
  );
}

interface HeaderProps {
  tab: WorkMap.Filter;
  columnOptions?: WorkMap.ColumnOptions;
}

export function TableHeader({ tab, columnOptions = {} }: HeaderProps) {
  const isCompletedPage = tab === "completed";

  return (
    <thead>
      <tr className="border-b-2 border-surface-outline dark:border-gray-600 bg-surface-dimmed dark:bg-gray-800/80 text-content-base dark:text-gray-200 text-xs sm:text-sm sticky top-0">
        <HeaderCell
          className={isCompletedPage ? "w-[65%] md:w-[58%] md:px-4" : "w-[65%] lg:w-[55%] xl:w-[40%] md:px-4"}
        >
          Name
        </HeaderCell>
        <HeaderCell hide={columnOptions.hideStatus} className={isCompletedPage ? "md:px-4" : "md:px-4"}>
          Status
        </HeaderCell>
        <HeaderCell hide={isCompletedPage || columnOptions.hideProgress} className="pr-6 lg:px-4">
          Progress
        </HeaderCell>
        <HeaderCell
          hide={columnOptions.hideDueDate}
          className={isCompletedPage ? "md:px-4" : "hidden lg:table-cell md:px-4"}
        >
          {isCompletedPage ? "Completed On" : "Due Date"}
        </HeaderCell>
        <HeaderCell hide={columnOptions.hideSpace} className="hidden lg:table-cell md:px-4">
          Space
        </HeaderCell>
        <HeaderCell hide={columnOptions.hideOwner} className="hidden xl:table-cell md:px-4">
          Champion
        </HeaderCell>
        <NextStepHeaderCell hide={isCompletedPage || columnOptions.hideNextStep} />
      </tr>
    </thead>
  );
}

interface HeaderCellProps {
  className?: string;
  hide?: boolean;
  children?: React.ReactNode;
}

function HeaderCell({ className, hide, children }: HeaderCellProps) {
  if (hide) return null;

  return (
    <th className={classNames("text-left py-2 md:py-3.5 px-2 font-semibold whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

function NextStepHeaderCell({ hide }: { hide?: boolean }) {
  const tooltipContent = (
    <div className="text-xs">
      <p className="mb-2">Shows what needs to happen next for this work to progress.</p>
      <p>For goals: The first target or checklist item that hasn't been completed yet</p>
      <p className="mb-2">For projects: The upcoming milestone (by due date)</p>
      <p>Empty when all targets/milestones are complete or none are defined.</p>
    </div>
  );

  return (
    <HeaderCell hide={hide} className="hidden xl:table-cell xl:w-[200px] 2xl:w-[300px] md:px-4">
      <div className="flex items-center gap-1">
        Next step
        <Tooltip content={tooltipContent} className="z-50">
          <IconInfoCircle size={12} className="text-content-dimmed" />
        </Tooltip>
      </div>
    </HeaderCell>
  );
}

function ZeroState({
  addingEnabled,
  spaceSearch,
  addItem,
  addItemDefaultSpace,
}: {
  addingEnabled: boolean;
  spaceSearch: SpaceField.SearchSpaceFn;
  addItem: WorkMap.AddNewItemFn;
  addItemDefaultSpace: SpaceField.Space;
}) {
  if (!addingEnabled) {
    return (
      <tr>
        <td colSpan={7} className="py-32 text-center">
          <div className="mb-4">Nothing here yet.</div>
        </td>
      </tr>
    );
  }

  const [isOpen, setIsOpen] = React.useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <tr>
      <td colSpan={7} className="py-32 text-center">
        <div className="mb-4">
          There's nothing here yet.
          <br />
          Start by adding your first goal to get things moving.
        </div>

        <PrimaryButton size="sm" onClick={open} testId="add-work-item">
          Add your first item
        </PrimaryButton>

        <AddItemModal
          isOpen={isOpen}
          close={close}
          parentGoal={null}
          spaceSearch={spaceSearch}
          save={addItem}
          space={addItemDefaultSpace}
        />
      </td>
    </tr>
  );
}

function AddNewRow({
  addingEnabled,
  spaceSearch,
  addItem,
  addItemDefaultSpace,
}: {
  addingEnabled: boolean;
  spaceSearch: SpaceField.SearchSpaceFn;
  addItem: WorkMap.AddNewItemFn;
  addItemDefaultSpace: SpaceField.Space;
}) {
  if (!addingEnabled) return null;

  const [isOpen, setIsOpen] = React.useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <tr>
      <td className="py-2 px-2 sm:px-4">
        <button
          className="flex items-center gap-1 text-sm text-content-dimmed hover:text-content-base transition-colors py-1.5 px-2 rounded-md hover:bg-surface-highlight"
          aria-label="Add new item"
          onClick={open}
        >
          <IconPlus size={16} className="text-content-dimmed" />
          <span>Add new item</span>
        </button>

        <AddItemModal
          isOpen={isOpen}
          close={close}
          parentGoal={null}
          spaceSearch={spaceSearch}
          save={addItem}
          space={addItemDefaultSpace}
        />
      </td>
    </tr>
  );
}
