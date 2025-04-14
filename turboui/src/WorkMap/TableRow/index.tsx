import { StatusBadge, AvatarWithName } from "../../";
import classNames from "../../utils/classnames";
import type { WorkMapItem, Status } from "../types";
import { useItemStatus } from "./hooks/useItemStatus";
import { QuickEntryWidget } from "./QuickEntryWidget";
import { RowContainer } from "./RowContainer";
import { ItemNameCell } from "./ItemNameCell";
import { TableRowProvider } from "./context";
import { ChildRows } from "./ChildRows";
import { ProgressCell } from "./ProgressCell";

interface Props {
  item: WorkMapItem;
  level: number;
  isLast: boolean;
  filter?: string;
  isSelected?: boolean;
  selectedItemId?: string;
  onRowClick?: (item: WorkMapItem) => void;
}

/**
 * TableRow component for rendering a WorkMap item (goal or project) in a table
 * Handles recursive rendering of children, styling for different item states,
 * and interactions like hover, selection, and adding new items
 */
export function TableRow({ item, level, isLast, filter, isSelected = false, onRowClick, selectedItemId }: Props) {
  return (
    <TableRowProvider
      item={item}
      level={level}
      isLast={isLast}
      filter={filter}
      isSelected={isSelected}
      selectedItemId={selectedItemId}
      onRowClick={onRowClick}
    >
      <RowContainer>
        <ItemNameCell />
        <StatusCell status={item.status} />
        {filter !== "completed" && (
          <ProgressCell 
            progress={item.progress} 
            status={item.status} 
          />
        )}
        <DeadlineCell 
          filter={filter}
          completedOn={item.completedOn}
          deadline={item.deadline}
          status={item.status}
        />
        <SpaceCell 
          space={item.space}
          status={item.status}
        />
        <OwnerCell 
          owner={item.owner}
          status={item.status}
        />
        {filter !== "completed" && (
          <NextStepCell 
            nextStep={item.nextStep}
            status={item.status}
          />
        )}
      </RowContainer>

      <QuickEntryWidget />
      <ChildRows />
    </TableRowProvider>
  );
}

// 
// Cell Components
// 

interface StatusCellProps {
  status: string;
}

function StatusCell({ status }: StatusCellProps) {
  return (
    <td className="py-2 px-2 md:px-4">
      <div className="transform group-hover:scale-105 transition-transform duration-150">
        <StatusBadge status={status} />
      </div>
    </td>
  );
}



interface DeadlineCellProps {
  filter?: string;
  completedOn?: { display: string };
  deadline?: { display: string; isPast?: boolean };
  status: Status;
}

function DeadlineCell({ 
  filter, 
  completedOn, 
  deadline, 
  status 
}: DeadlineCellProps) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);
  return (
    <td
      className={classNames(
        "py-2 px-2 md:px-4",
        filter !== "completed" && "hidden lg:table-cell"
      )}
    >
      {filter === "completed" && completedOn ? (
        <span className="text-xs sm:text-sm whitespace-nowrap text-content-base">
          {completedOn.display}
        </span>
      ) : (
        <span
          className={classNames(
            "text-sm whitespace-nowrap",
            {
              "text-red-600": deadline?.isPast && !isCompleted && !isFailed && !isDropped && !isPending,
              "text-content-base": !(deadline?.isPast && !isCompleted && !isFailed && !isDropped && !isPending),
              "line-through text-content-dimmed": isCompleted || isFailed,
              "line-through opacity-70 text-content-dimmed": isDropped,
              "text-content-dimmed": isPending
            }
          )}
        >
          {deadline?.display}
        </span>
      )}
    </td>
  );
}

interface SpaceCellProps {
  space: string;
  status: Status;
}

function SpaceCell({ space, status }: SpaceCellProps) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);
  return (
    <td className="py-2 px-2 md:px-4 hidden lg:table-cell">
      <div className="w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
        <a
          href="#"
          title={space}
          className={classNames(
            "text-sm hover:underline",
            isCompleted || isFailed
              ? "text-content-dimmed"
              : "text-content-base hover:text-link-hover",
            isDropped && "opacity-70 text-content-dimmed",
            isPending && "text-content-dimmed"
          )}
        >
          {space}
        </a>
      </div>
    </td>
  );
}

interface OwnerCellProps {
  owner: WorkMapItem["owner"];
  status: Status;
}

function OwnerCell({ owner, status }: OwnerCellProps) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);
  return (
    <td className="py-2 px-2 md:px-4 hidden xl:table-cell">
      <div className="max-w-[120px] overflow-hidden">
        <AvatarWithName
          person={owner}
          size="tiny"
          className={classNames(
            "text-sm truncate hover:underline transition-colors whitespace-nowrap overflow-hidden text-ellipsis inline-block",
            isCompleted || isFailed
              ? "text-content-dimmed"
              : "text-content-base hover:text-link-hover",
            isDropped && "opacity-70 text-content-dimmed",
            isPending && "text-content-dimmed"
          )}
        />
      </div>
    </td>
  );
}

interface NextStepCellProps {
  nextStep: string;
  status: Status;
}

function NextStepCell({ nextStep, status }: NextStepCellProps) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);
  return (
    <td className="py-2 px-2 md:px-4 hidden xl:table-cell">
      <div className="w-full xl:max-w-[200px] 2xl:max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
        <span
          title={nextStep}
          className={classNames(
            "text-sm transition-colors duration-150",
            isCompleted || isFailed
              ? "line-through text-content-dimmed"
              : "text-content-base group-hover:text-content-intense",
            isDropped && "line-through opacity-70 text-content-dimmed",
            isPending && "text-content-dimmed"
          )}
        >
          {nextStep}
        </span>
      </div>
    </td>
  );
}