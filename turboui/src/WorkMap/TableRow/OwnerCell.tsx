import { AvatarWithName } from "../../Avatar/AvatarWithName";
import { Status, WorkMapItem } from "../types";
import { useItemStatus } from "../hooks/useItemStatus";
import classNames from "../../utils/classnames";

interface Props {
  owner: WorkMapItem["owner"];
  status: Status;
}

export function OwnerCell({ owner, status }: Props) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(status);

  const className = classNames(
    "text-sm truncate hover:underline transition-colors whitespace-nowrap overflow-hidden text-ellipsis inline-block",
    isCompleted || isFailed
      ? "text-content-dimmed"
      : "text-content-base hover:text-link-hover",
    isDropped && "opacity-70 text-content-dimmed",
    isPending && "text-content-dimmed"
  );

  return (
    <td className="py-2 px-2 md:px-4 hidden xl:table-cell">
      <div className="max-w-[120px] overflow-hidden">
        <AvatarWithName
          person={owner}
          size="tiny"
          nameFormat="short"
          className={className}
        />
      </div>
    </td>
  );
}
