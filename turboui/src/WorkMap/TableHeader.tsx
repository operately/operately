interface Props {
  filter?: string;
}

export function TableHeader({ filter }: Props) {
  const isCompletedPage = filter === "completed";

  return (
    <thead>
      <tr className="border-b-2 border-surface-outline dark:border-gray-600 bg-surface-dimmed dark:bg-gray-800/80 text-content-base dark:text-gray-200 text-xs sm:text-sm sticky top-0">
        {/* Name column */}
        <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold w-[35%] md:w-[40%] sm:w-[45%]">
          Name
        </th>
        {/* Status column */}
        <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold w-[170px] md:w-[140px]">
          Status
        </th>
        {/* Progress column - not shown on completed page */}
        {filter !== "completed" && (
          <th className="text-left py-2 md:py-3.5 px-2 pr-6 lg:px-4 font-semibold w-[45px] md:w-[55px]">
            Progress
          </th>
        )}
        {/* Deadline/Completed On column */}
        <th
          className={`text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold ${
            isCompletedPage
              ? "w-[100px] md:w-[120px]"
              : "hidden lg:table-cell w-[120px]"
          }`}
        >
          {isCompletedPage ? "Completed On" : "Deadline"}
        </th>
        {/* Space column */}
        <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold hidden lg:table-cell w-[90px]">
          Space
        </th>
        {/* Champion column */}
        <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold hidden xl:table-cell w-[120px]">
          Champion
        </th>
        {/* Next step column - only shown on non-completed pages */}
        {filter !== "completed" && (
          <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold xl:w-[200px] 2xl:w-[300px] hidden xl:table-cell">
            Next step
          </th>
        )}
      </tr>
    </thead>
  );
}
