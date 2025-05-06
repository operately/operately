import { useState } from "react";

import { StatusBadge } from "../../../StatusBadge";
import { WorkMap } from "..";

import { ChildRows } from "./ChildRows";
import { DeadlineCell } from "./DeadlineCell";
import { ItemNameCell } from "./ItemNameCell";
import { NextStepCell } from "./NextStepCell";
import { OwnerCell } from "./OwnerCell";
import { ProgressCell } from "./ProgressCell";
import { SpaceCell } from "./SpaceCell";
import { RowContainer } from "./RowContainer";

interface Props {
  item: WorkMap.Item;
  level: number;
  isLast: boolean;
  filter: WorkMap.Filter;
}

export function TableRow(props: Props) {
  const { item, filter, level } = props;
  const [expanded, setExpanded] = useState<boolean>(true);

  return (
    <>
      <RowContainer item={item}>
        <ItemNameCell item={item} filter={filter} level={level} expanded={expanded} setExpanded={setExpanded} />
        <StatusCell status={item.status} />
        <ProgressCell progress={item.progress} status={item.status} hide={filter === "completed"} />
        <DeadlineCell filter={filter} completedOn={item.closedAt} timeframe={item.timeframe} status={item.status} />
        <SpaceCell item={item} />
        <OwnerCell item={item} />
        <NextStepCell nextStep={item.nextStep} status={item.status} hide={filter === "completed"} />
      </RowContainer>

      <ChildRows {...props} expanded={expanded} />
    </>
  );
}

function StatusCell({ status }: { status: WorkMap.Status }) {
  return (
    <td className="py-2 px-2 md:px-4">
      <StatusBadge status={status} />
    </td>
  );
}
