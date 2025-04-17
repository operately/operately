import { WorkMap } from "..";
import { useItemStatus } from "../hooks/useItemStatus";
import classNames from "../../utils/classnames";

interface SpaceCellProps {
  space: WorkMap.Item['space'];
  status: WorkMap.Status;
}

export function SpaceCell({ space, status }: SpaceCellProps) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);

  const className = classNames(
    "text-sm hover:underline",
    isCompleted || isFailed
      ? "text-content-dimmed"
      : "text-content-base hover:text-link-hover",
    isDropped && "opacity-70 text-content-dimmed",
    isPending && "text-content-dimmed"
  );

  return (
    <td className="py-2 px-2 md:px-4 hidden lg:table-cell">
      <div className="w-[100px]  overflow-hidden text-ellipsis whitespace-nowrap">
        <a href="#" title={space} className={className}>
          {space}
        </a>
      </div>
    </td>
  );
}
