import React from "react";
import { WorkMap } from "..";
import { useItemStatus } from "../../hooks/useItemStatus";
import { BlackLink } from "../../../Link";
import classNames from "../../../utils/classnames";

interface SpaceCellProps {
  item: WorkMap.Item;
  hide?: boolean;
}

export function SpaceCell({ item, hide }: SpaceCellProps) {
  const { isCompleted, isFailed, isPending } = useItemStatus(item.status);

  const className = classNames(
    "text-sm hover:underline",
    isCompleted || isFailed ? "text-content-dimmed" : "text-content-base hover:text-link-hover",
    isPending && "text-content-dimmed",
  );

  if (hide) return null;
  const hasSpace = Boolean(item.space && item.spacePath);

  return (
    <td className="py-2 px-2 md:px-4 hidden lg:table-cell">
      <div className="max-w-[100px] min-w-[70px] w-fit overflow-hidden text-ellipsis whitespace-nowrap">
        {hasSpace ? (
          <BlackLink to={item.spacePath!} className={className} underline="hover">
            {item.space?.name}
          </BlackLink>
        ) : null}
      </div>
    </td>
  );
}
