import { ProgressBar, ProgressBarStatus } from "../../..";
import { WorkMap } from "..";
import { useItemStatus } from "../../hooks/useItemStatus";

interface ProgressCellProps {
  progress: WorkMap.Item["progress"];
  status: WorkMap.Item["status"];
  hide?: boolean;
}

export function ProgressCell({ progress, status, hide }: ProgressCellProps) {
  const { isCompleted } = useItemStatus(status);

  if (hide) return null;
  
  if (isCompleted) {
    return <td className="py-2 px-2 pr-4 md:px-4"></td>;
  }
  
  return (
    <td className="py-2 px-2 pr-6 lg:px-4">
      <div className="transform group-hover:scale-[1.02] transition-transform duration-150">
        <ProgressBar progress={progress ?? 0} status={status as ProgressBarStatus} />
      </div>
    </td>
  );
}
