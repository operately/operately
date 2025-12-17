import React from "react";

import { WorkMap } from "..";
import { SpaceField } from "../../SpaceField";
import { Tooltip } from "../../Tooltip";
import { IconInfoCircle, IconPlus } from "../../icons";
import classNames from "../../utils/classnames";
import { useStateWithLocalStorage } from "../../utils/useStateWithLocalStorage";
import { AddItemModal } from "./AddItemModal";
import { IsItemExpandedFn, SetItemExpandedFn, TableRow } from "./TableRow";
import { ZeroState } from "./ZeroState";
import { compareIds } from "../../utils/ids";

interface Props {
  items: WorkMap.Item[];
  addingEnabled?: boolean;
  tab: WorkMap.Filter;
  columnOptions?: WorkMap.ColumnOptions;
  addItem?: WorkMap.AddNewItemFn;
  spaceSearch?: SpaceField.SearchSpaceFn;
  addItemDefaultSpace?: SpaceField.Space;
  type?: WorkMap.WorkMapType;
  viewer?: WorkMap.Person;
  profileUser?: WorkMap.Person;
  hideCompanyAccessInQuickAdd?: boolean;
}

export function WorkMapTable({
  items,
  tab,
  columnOptions = {},
  addItem,
  addingEnabled = false,
  spaceSearch,
  addItemDefaultSpace,
  type = "company",
  viewer,
  profileUser,
  hideCompanyAccessInQuickAdd = false,
}: Props) {
  const emptyWorkMap = items.length === 0;
  const showIndentation = React.useMemo(() => items.some((item) => item.children.length > 0), [items]);

  const storageScope = React.useMemo(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "unknown";
    return `${type}:${path}`;
  }, [type]);

  const [expandedState, setExpandedState] = useStateWithLocalStorage<Record<string, boolean>>(
    "workmap",
    storageScope,
    {},
  );

  const getItemExpanded = React.useCallback<IsItemExpandedFn>((id) => expandedState[id] !== false, [expandedState]);

  const setItemExpanded = React.useCallback<SetItemExpandedFn>(
    (id, valueOrUpdater) => {
      setExpandedState((previousState) => {
        const currentValue = previousState[id] ?? true;
        const nextValue =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as (prev: boolean) => boolean)(currentValue)
            : valueOrUpdater;

        if (nextValue === true) {
          if (currentValue === true && !(id in previousState)) {
            return previousState;
          }

          const { [id]: _removed, ...rest } = previousState;
          return rest;
        }

        if (currentValue === nextValue) {
          return previousState;
        }

        return { ...previousState, [id]: nextValue };
      });
    },
    [setExpandedState],
  );

  return (
    <div className="overflow-x-auto bg-surface-base rounded-b-lg">
      {emptyWorkMap ? (
        <ZeroState
          addingEnabled={addingEnabled}
          spaceSearch={spaceSearch!}
          addItem={addItem!}
          addItemDefaultSpace={addItemDefaultSpace!}
          hideCompanyAccess={hideCompanyAccessInQuickAdd}
        />
      ) : (
        <table className="min-w-full divide-y divide-surface-outline">
          <TableHeader tab={tab} columnOptions={columnOptions} profileUser={profileUser} viewer={viewer} />
          <tbody>
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
                hideCompanyAccessInQuickAdd={hideCompanyAccessInQuickAdd}
                isExpanded={getItemExpanded}
                setItemExpanded={setItemExpanded}
                profileUser={profileUser}
              />
            ))}

            {addingEnabled && (
              <AddNewRow
                addingEnabled={addingEnabled}
                spaceSearch={spaceSearch!}
                addItem={addItem!}
                addItemDefaultSpace={addItemDefaultSpace!}
                hideCompanyAccess={hideCompanyAccessInQuickAdd}
              />
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface HeaderProps {
  tab: WorkMap.Filter;
  columnOptions?: WorkMap.ColumnOptions;
  viewer?: WorkMap.Person;
  profileUser?: WorkMap.Person;
}

export function TableHeader({ tab, columnOptions = {}, viewer, profileUser }: HeaderProps) {
  const isCompletedPage = tab === "completed";
  const roleLabel = getRoleLabel(viewer, profileUser);

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
        <HeaderCell hide={columnOptions.hideProject} className="hidden lg:table-cell md:px-4">
          Project
        </HeaderCell>
        <HeaderCell hide={columnOptions.hideOwner} className="hidden xl:table-cell md:px-4">
          Champion
        </HeaderCell>
        {roleLabel && (
          <HeaderCell hide={columnOptions.hideRole} className="hidden xl:table-cell md:px-4">
            {roleLabel}
          </HeaderCell>
        )}
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

function AddNewRow({
  addingEnabled,
  spaceSearch,
  addItem,
  addItemDefaultSpace,
  hideCompanyAccess,
}: {
  addingEnabled: boolean;
  spaceSearch: SpaceField.SearchSpaceFn;
  addItem: WorkMap.AddNewItemFn;
  addItemDefaultSpace: SpaceField.Space;
  hideCompanyAccess: boolean;
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
          hideCompanyAccess={hideCompanyAccess}
        />
      </td>
    </tr>
  );
}

function getRoleLabel(viewer?: WorkMap.Person, profileUser?: WorkMap.Person) {
  if (!profileUser) return;

  const isViewer = compareIds(viewer?.id, profileUser?.id);
  return isViewer ? "My Role" : "Role";
}
