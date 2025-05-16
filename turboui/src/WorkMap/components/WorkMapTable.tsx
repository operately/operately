import React from "react";
import { WorkMap } from "..";
import classNames from "../../utils/classnames";
import { TableRow } from "./TableRow";

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
            <TableRow
              key={item.id}
              item={item}
              level={0}
              isLast={idx === items.length - 1}
              tab={tab}
              columnOptions={columnOptions}
            />
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
      <tr className="border-y border-stroke-base dark:border-gray-600 bg-surface-dimmed dark:bg-gray-800/80 text-content-base dark:text-gray-200 text-xs sm:text-sm sticky top-0">
        <HeaderCell className={isCompletedPage ? "w-[60%] md:w-[50%] md:px-4" : "md:px-4"}>Name</HeaderCell>
        <HeaderCell
          hide={columnOptions.hideStatus}
          className={isCompletedPage ? "w-[110px] md:w-[130px] md:px-4" : "w-[100px] md:w-[130px] md:px-4"}
        >
          Status
        </HeaderCell>
        <HeaderCell hide={isCompletedPage || columnOptions.hideProgress} className="w-[75px] md:w-[90px] pr-6 lg:px-4">
          Progress
        </HeaderCell>
        <HeaderCell
          hide={columnOptions.hideDeadline}
          className={isCompletedPage ? "w-[100px] md:w-[120px] md:px-4" : "hidden lg:table-cell max-w-[120px] md:px-4"}
        >
          {isCompletedPage ? "Completed On" : "Deadline"}
        </HeaderCell>
        <HeaderCell hide={columnOptions.hideSpace} className="hidden lg:table-cell max-w-[100px] w-auto md:px-4">
          Space
        </HeaderCell>
        <HeaderCell hide={columnOptions.hideOwner} className="hidden xl:table-cell w-[120px] md:px-4">
          Champion
        </HeaderCell>
        <HeaderCell
          hide={isCompletedPage || columnOptions.hideNextStep}
          className="hidden xl:table-cell xl:w-[200px] 2xl:w-[300px] md:px-4"
        >
          Next step
        </HeaderCell>
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

  return <th className={classNames("text-left py-2 px-2 font-semibold whitespace-nowrap", className)}>{children}</th>;
}
