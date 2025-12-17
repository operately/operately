import React from "react";
import { StatusBadge } from "../../../StatusBadge";
import { WorkMap } from "..";

interface Props {
  item: WorkMap.Item;
  hide?: boolean;
}

export function StatusCell({ item, hide }: Props) {
  if (hide) return null;

  return (
    <td className="py-2 px-2 md:px-4">
      <StatusBadge status={item.taskStatus || item.status} />
    </td>
  );
}

