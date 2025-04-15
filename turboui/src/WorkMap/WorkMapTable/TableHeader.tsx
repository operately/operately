import classNames from "../../utils/classnames";

interface Props {
  filter?: string;
}

export function TableHeader({ filter }: Props) {
  const isCompletedPage = filter === "completed";

  return (
    <thead>
      <tr className="border-b-2 border-surface-outline dark:border-gray-600 bg-surface-dimmed dark:bg-gray-800/80 text-content-base dark:text-gray-200 text-xs sm:text-sm sticky top-0">
        <HeaderCell className="xs:w-[80%] sm:w-[75%] md:w-[70%] lg:w-[60%] xl:w-[40%]">
          Name
        </HeaderCell>
        <HeaderCell className="min-w-[100px] md:min-w-[130px]">
          Status
        </HeaderCell>
        <HeaderCell hidden={isCompletedPage}>Progress</HeaderCell>
        <HeaderCell className="hidden lg:table-cell">
          {isCompletedPage ? "Completed On" : "Deadline"}
        </HeaderCell>
        <HeaderCell className="hidden lg:table-cell">Space</HeaderCell>
        <HeaderCell className="hidden xl:table-cell">Champion</HeaderCell>
        <HeaderCell className="hidden xl:table-cell" hidden={isCompletedPage}>
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

  return (
    <th
      className={classNames(
        "text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold",
        className
      )}
    >
      {children}
    </th>
  );
}
