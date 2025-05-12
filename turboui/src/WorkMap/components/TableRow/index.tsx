import { useState } from "react";

import { StatusBadge } from "../../../StatusBadge";
import { WorkMap } from "..";

import { ChildRows } from "./ChildRows";
import { DeadlineCell } from "./DeadlineCell";
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
  filter: WorkMap.Filter;
  columnOptions?: WorkMap.ColumnOptions;
}

export function TableRow(props: Props) {
  const { item, filter, level, columnOptions } = props;
  const [expanded, setExpanded] = useState<boolean>(true);

  return (
    <>
      <RowContainer item={item}>
        <ItemNameCell item={item} filter={filter} level={level} expanded={expanded} setExpanded={setExpanded} />
        <StatusCell status={item.status} hide={columnOptions?.hideStatus} />
        <ProgressCell
          progress={item.progress}
          status={item.status}
          hide={filter === "completed" || columnOptions?.hideProgress}
        />
        <DeadlineCell
          filter={filter}
          completedOn={item.closedAt}
          timeframe={item.timeframe}
          status={item.status}
          hide={columnOptions?.hideDeadline}
        />
        <SpaceCell item={item} hide={columnOptions?.hideSpace} />
        <OwnerCell item={item} hide={columnOptions?.hideOwner} />
        <NextStepCell
          nextStep={item.nextStep}
          status={item.status}
          hide={filter === "completed" || columnOptions?.hideNextStep}
        />
      </RowContainer>

      <ChildRows {...props} expanded={expanded} />
    </>
  );
}
