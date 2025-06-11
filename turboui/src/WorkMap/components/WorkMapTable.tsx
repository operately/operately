import React from "react";
import { WorkMap } from "..";
import { TableRow } from "./TableRow";
import classNames from "../../utils/classnames";
import { Tooltip } from "../../Tooltip";
import { IconInfoCircle } from "@tabler/icons-react";

interface Props {
  items: WorkMap.Item[];
  tab: WorkMap.Filter;
  columnOptions?: WorkMap.ColumnOptions;
}

export function WorkMapTable({ items, tab, columnOptions = {} }: Props) {
  return (
    <div className="overflow-x-auto bg-surface-base rounded-b-lg">
      <table className="min-w-full divide-y divide-surface-outline">
        <TableHeader tab={tab} columnOptions={columnOptions} />
        <tbody>
          {items.map((item, idx) => (
            <TableRow key={item.id} item={item} level={0} isLast={idx === items.length - 1} tab={tab} columnOptions={columnOptions} />
          ))}
        </tbody>
      </table>
    </div>
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
        <HeaderCell className={isCompletedPage ? "w-[65%] md:w-[58%] md:px-4" : "w-[65%] lg:w-[55%] xl:w-[40%] md:px-4"}>Name</HeaderCell>
        <HeaderCell hide={columnOptions.hideStatus} className={isCompletedPage ? "md:px-4" : "md:px-4"}>
          Status
        </HeaderCell>
        <HeaderCell hide={isCompletedPage || columnOptions.hideProgress} className="pr-6 lg:px-4">
          Progress
        </HeaderCell>
        <HeaderCell hide={columnOptions.hideDueDate} className={isCompletedPage ? "md:px-4" : "hidden lg:table-cell md:px-4"}>
          {isCompletedPage ? "Completed On" : "Due Date"}
        </HeaderCell>
        <HeaderCell hide={columnOptions.hideSpace} className="hidden lg:table-cell md:px-4">Space</HeaderCell>
        <HeaderCell hide={columnOptions.hideOwner} className="hidden xl:table-cell md:px-4">Champion</HeaderCell>
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
      <p>For goals: The first target that hasn't been completed yet</p>
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
