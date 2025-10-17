import React from "react";

import { WorkMap } from "..";

import { SpaceField } from "../../../SpaceField";
import { ChildRows } from "./ChildRows";
import { DueDateCell } from "./DueDateCell";
import { ItemNameCell } from "./ItemNameCell";
import { NextStepCell } from "./NextStepCell";
import { OwnerCell } from "./OwnerCell";
import { ProgressCell } from "./ProgressCell";
import { RowContainer } from "./RowContainer";
import { SpaceCell } from "./SpaceCell";
import { StatusCell } from "./StatusCell";
import { RoleCell } from "./RoleCell";

export type IsItemExpandedFn = (id: string) => boolean;
export type SetItemExpandedFn = (id: string, value: boolean | ((prev: boolean) => boolean)) => void;

interface Props {
  item: WorkMap.Item;
  level: number;
  isLast: boolean;
  tab: WorkMap.Filter;
  showIndentation: boolean;
  columnOptions?: WorkMap.ColumnOptions;
  addItem?: WorkMap.AddNewItemFn;
  addingEnabled?: boolean;
  spaceSearch?: SpaceField.SearchSpaceFn;
  isExpanded: IsItemExpandedFn;
  setItemExpanded: SetItemExpandedFn;
  profileUser?: WorkMap.Person;
}

export function TableRow(props: Props) {
  const { item, tab, level, columnOptions, isExpanded: getItemExpanded, setItemExpanded } = props;
  const expanded = getItemExpanded(item.id);

  const handleSetExpanded = React.useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (valueOrUpdater) => {
      setItemExpanded(item.id, valueOrUpdater);
    },
    [item.id, setItemExpanded],
  );

  return (
    <>
      <RowContainer item={item}>
        <ItemNameCell
          item={item}
          level={level}
          expanded={expanded}
          setExpanded={handleSetExpanded}
          showIndentation={props.showIndentation}
          canAddChildren={Boolean(props.addingEnabled) && tab !== "completed"}
          spaceSearch={props.spaceSearch}
          addItem={props.addItem}
        />
        <StatusCell status={item.status} hide={columnOptions?.hideStatus} />
        <ProgressCell
          progress={item.progress}
          status={item.status}
          hide={tab === "completed" || columnOptions?.hideProgress}
        />
        <DueDateCell
          tab={tab}
          completedOn={item.completedOn}
          timeframe={item.timeframe}
          status={item.status}
          hide={columnOptions?.hideDueDate}
        />
        <SpaceCell item={item} hide={columnOptions?.hideSpace} />
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
