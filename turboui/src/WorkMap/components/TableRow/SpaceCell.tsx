import { WorkMap } from "..";
import { useItemStatus } from "../../hooks/useItemStatus";
import { BlackLink } from "../../../Link";
import classNames from "../../../utils/classnames";

interface SpaceCellProps {
  item: WorkMap.Item;
}

export function SpaceCell({ item }: SpaceCellProps) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(item.status);

  const className = classNames(
    "text-sm hover:underline",
    isCompleted || isFailed ? "text-content-dimmed" : "text-content-base hover:text-link-hover",
    isDropped && "opacity-70 text-content-dimmed",
    isPending && "text-content-dimmed",
  );

  return (
    <td className="py-2 px-2 md:px-4 hidden lg:table-cell">
      <div className="w-[100px]  overflow-hidden text-ellipsis whitespace-nowrap">
        <BlackLink to={item.spacePath!} className={className} underline="hover">
          {item.space?.name}
        </BlackLink>
      </div>
    </td>
  );
}
