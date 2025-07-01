import React, { useState } from "react";

import { WorkMap } from "..";

import { ChildRows } from "./ChildRows";
import { DueDateCell } from "./DueDateCell";
import { ItemNameCell } from "./ItemNameCell";
import { NextStepCell } from "./NextStepCell";
import { OwnerCell } from "./OwnerCell";
import { ProgressCell } from "./ProgressCell";
import { RowContainer } from "./RowContainer";
import { SpaceCell } from "./SpaceCell";
import { StatusCell } from "./StatusCell";

interface Props {
  item: WorkMap.Item;
  level: number;
  isLast: boolean;
  tab: WorkMap.Filter;
  showIndentation: boolean;
  columnOptions?: WorkMap.ColumnOptions;
  canAddChildren: boolean;
}

export function TableRow(props: Props) {
  const { item, tab, level, columnOptions } = props;
  const [expanded, setExpanded] = useState<boolean>(true);

  return (
    <>
      <RowContainer item={item}>
        <ItemNameCell
          item={item}
          level={level}
          expanded={expanded}
          setExpanded={setExpanded}
          showIndentation={props.showIndentation}
          canAddChildren={props.canAddChildren}
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
        <NextStepCell
          nextStep={item.nextStep}
          status={item.status}
          hide={tab === "completed" || columnOptions?.hideNextStep}
        />
      </RowContainer>

      <ChildRows {...props} expanded={expanded} canAddChildren={props.canAddChildren} />
    </>
  );
}
