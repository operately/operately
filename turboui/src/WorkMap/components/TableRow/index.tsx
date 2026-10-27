import React from "react";
import { DragHandle, DropIndicator, useSortableItem } from "../../../utils/PragmaticDragAndDrop";

import { WorkMap } from "..";

import type { ProjectTemplateSelection } from "../../../ProjectTemplateSelection";
import { SpaceField } from "../../../SpaceField";
import { ChildRows } from "./ChildRows";
import { AssignedDateCell } from "./AssignedDateCell";
import { DueDateCell } from "./DueDateCell";
import { ItemNameCell } from "./ItemNameCell";
import { NextStepCell } from "./NextStepCell";
import { OwnerCell } from "./OwnerCell";
import { ProjectCell } from "./ProjectCell";
import { ProgressCell } from "./ProgressCell";
import { RowContainer } from "./RowContainer";
import { SpaceCell } from "./SpaceCell";
import { StatusCell } from "./StatusCell";
import { RoleCell } from "./RoleCell";
import type { FormattedTimePreferences } from "../../../FormattedTime";

export type IsItemExpandedFn = (id: string) => boolean;
export type SetItemExpandedFn = (id: string, value: boolean | ((prev: boolean) => boolean)) => void;

interface Props {
  reorder?: {
    index: number;
    disabled: boolean;
  };
  item: WorkMap.Item;
  level: number;
  isLast: boolean;
  tab: WorkMap.Filter;
  showIndentation: boolean;
  columnOptions?: WorkMap.ColumnOptions;
  addItem?: WorkMap.AddNewItemFn;
  addingEnabled?: boolean;
  spaceSearch?: SpaceField.SearchSpaceFn;
  hideCompanyAccessInQuickAdd?: boolean;
  isExpanded: IsItemExpandedFn;
  setItemExpanded: SetItemExpandedFn;
  profileUser?: WorkMap.Person;
  formattedTimePreferences: FormattedTimePreferences;
  projectTemplates?: ProjectTemplateSelection.Template[];
  onCreateProjectTemplate?: (spaceId: string) => void;
}

export function TableRow(props: Props) {
  const { item, tab, level, columnOptions, isExpanded: getItemExpanded, setItemExpanded } = props;
  const reorder = level === 0 ? props.reorder : undefined;
  const { ref, dragHandleRef, isDragging, closestEdge } = useSortableItem<HTMLTableRowElement>({
    itemId: item.id,
    index: reorder?.index ?? 0,
    scope: "personal-tasks",
    disabled: !reorder || reorder.disabled,
  });
  const expanded = getItemExpanded(item.id);

  const handleSetExpanded = React.useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (valueOrUpdater) => {
      setItemExpanded(item.id, valueOrUpdater);
    },
    [item.id, setItemExpanded],
  );

  return (
    <>
      <RowContainer item={item} sortableRef={ref} isDragging={isDragging}>
        <ItemNameCell
          reorderControls={
            reorder && (
              <div className="flex items-center mr-2">
                <span
                  ref={dragHandleRef as React.RefObject<HTMLSpanElement>}
                  className="inline-flex w-4 shrink-0"
                  data-test-id={`drag-task-${item.id}`}
                >
                  <DragHandle isDragging={isDragging} disabled={reorder.disabled} className="opacity-100" />
                </span>
                {closestEdge && <DropIndicator edge={closestEdge} />}
              </div>
            )
          }
          item={item}
          level={level}
          expanded={expanded}
          setExpanded={handleSetExpanded}
          showIndentation={props.showIndentation}
          canAddChildren={Boolean(props.addingEnabled) && tab !== "completed"}
          spaceSearch={props.spaceSearch}
          addItem={props.addItem}
          hideCompanyAccess={props.hideCompanyAccessInQuickAdd}
          projectTemplates={props.projectTemplates}
          onCreateProjectTemplate={props.onCreateProjectTemplate}
        />
        <StatusCell item={item} hide={columnOptions?.hideStatus} />
        <ProgressCell item={item} hide={tab === "completed" || columnOptions?.hideProgress} />
        <DueDateCell
          tab={tab}
          completedOn={item.completedOn}
          timeframe={item.timeframe}
          status={item.status}
          hide={columnOptions?.hideDueDate}
          formattedTimePreferences={props.formattedTimePreferences}
        />
        <AssignedDateCell
          assignedAt={item.assignedAt}
          hide={columnOptions?.hideAssignedDate}
          formattedTimePreferences={props.formattedTimePreferences}
        />
        <SpaceCell item={item} hide={columnOptions?.hideSpace} />
        <ProjectCell item={item} hide={columnOptions?.hideProject} />
        <OwnerCell item={item} hide={columnOptions?.hideOwner} />
        {props.profileUser && <RoleCell item={item} hide={columnOptions?.hideRole} profileUser={props.profileUser} />}
        <NextStepCell
          nextStep={item.nextStep}
          status={item.status}
          hide={tab === "completed" || columnOptions?.hideNextStep}
        />
      </RowContainer>

      <ChildRows {...props} expanded={expanded} isExpanded={getItemExpanded} setItemExpanded={setItemExpanded} />
    </>
  );
}
