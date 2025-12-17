import React from "react";
import { StatusBadge } from "../../../StatusBadge";
import { StatusSelector } from "../../../StatusSelector";
import { WorkMap } from "..";

interface Props {
  item: WorkMap.Item;
  hide?: boolean;
}

export function StatusCell({ item, hide }: Props) {
  if (hide) return null;

  return (
    <td className="py-2 px-2 md:px-4">
      {item.type === "task" && item.taskStatus ? (
        <StatusSelector
          statusOptions={[item.taskStatus]}
          status={item.taskStatus}
          onChange={() => {}}
          readonly
          showFullBadge
        />
      ) : (
        <StatusBadge status={item.status} />
      )}
    </td>
  );
}

