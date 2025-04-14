import { ProgressBar, ProgressBarStatus } from "../../";
import { Status } from "../types";
import { useItemStatus } from "./hooks/useItemStatus";

interface ProgressCellProps {
  progress: number;
  status: Status;
}

export function ProgressCell({ progress, status }: ProgressCellProps) {
  const { isCompleted } = useItemStatus(status);
  
  if (isCompleted) {
    return <td className="py-2 px-2 pr-4 md:px-4"></td>;
  }
  
  return (
    <td className="py-2 px-2 pr-6 lg:px-4 min-w-[150px] w-[15%]">
      <div className="transform group-hover:scale-[1.02] transition-transform duration-150">
        <ProgressBar progress={progress} status={status as ProgressBarStatus} />
      </div>
    </td>
  );
}
