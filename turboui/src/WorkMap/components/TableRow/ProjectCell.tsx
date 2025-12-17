import React from "react";

import { WorkMap } from "..";
import { BlackLink } from "../../../Link";
import classNames from "../../../utils/classnames";
import { useItemStatus } from "../../hooks/useItemStatus";

interface Props {
  item: WorkMap.Item;
  hide?: boolean;
}

export function ProjectCell({ item, hide }: Props) {
  const { isCompleted, isFailed, isPending } = useItemStatus(item.status);

  const className = classNames(
    "text-sm hover:underline",
    isCompleted || isFailed ? "text-content-dimmed" : "text-content-base hover:text-link-hover",
    isPending && "text-content-dimmed",
  );

  if (hide) return null;

  if (!item.project || !item.projectPath) return <td className="py-2 px-2 md:px-4 hidden lg:table-cell" />;

  return (
    <td className="py-2 px-2 md:px-4 hidden lg:table-cell">
      <div className="max-w-[140px] min-w-[90px] w-fit overflow-hidden text-ellipsis whitespace-nowrap">
        <BlackLink to={item.projectPath} className={className} underline="hover">
          {item.project.name}
        </BlackLink>
      </div>
    </td>
  );
}
