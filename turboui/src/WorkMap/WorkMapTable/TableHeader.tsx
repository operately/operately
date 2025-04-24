import WorkMap from "..";
import classNames from "../../utils/classnames";

interface Props {
  filter: WorkMap.Filter;
}

export function TableHeader({ filter }: Props) {
  const isCompletedPage = filter === "completed";

  return (
    <thead>
      <tr className="border-b-2 border-surface-outline dark:border-gray-600 bg-surface-dimmed dark:bg-gray-800/80 text-content-base dark:text-gray-200 text-xs sm:text-sm sticky top-0">
        <HeaderCell className={isCompletedPage ? "w-[60%] md:w-[50%] md:px-4" : "md:px-4"}>Name</HeaderCell>
        <HeaderCell className={isCompletedPage ? "w-[110px] md:w-[130px] md:px-4" : "w-[100px] md:w-[130px] md:px-4"}>
          Status
        </HeaderCell>
        <HeaderCell hidden={isCompletedPage} className="w-[75px] md:w-[90px] pr-6 lg:px-4">
          Progress
        </HeaderCell>
        <HeaderCell className={isCompletedPage ? "w-[100px] md:w-[120px] md:px-4" : "hidden lg:table-cell w-[120px] md:px-4"}>
          {isCompletedPage ? "Completed On" : "Deadline"}
        </HeaderCell>
        <HeaderCell className="hidden lg:table-cell w-[100px] md:px-4">Space</HeaderCell>
        <HeaderCell className="hidden xl:table-cell w-[120px] md:px-4">Champion</HeaderCell>
        <HeaderCell hidden={isCompletedPage} className="hidden xl:table-cell xl:w-[200px] 2xl:w-[300px] md:px-4">
          Next step
        </HeaderCell>
      </tr>
    </thead>
  );
}

interface HeaderCellProps {
  className?: string;
  hidden?: boolean;
  children?: React.ReactNode;
}

function HeaderCell({ className, hidden, children }: HeaderCellProps) {
  if (hidden) return null;

  return <th className={classNames("text-left py-2 md:py-3.5 px-2 font-semibold", className)}>{children}</th>;
}
