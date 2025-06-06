import React from "react";
import { StatusBadge } from "../../../StatusBadge";
import { WorkMap } from "..";

interface Props {
  status: WorkMap.Item["status"];
  hide?: boolean;
}

export function StatusCell({ status, hide }: Props) {
  if (hide) return null;

  return (
    <td className="py-2 px-2 md:px-4">
      <StatusBadge status={status} />
    </td>
  );
}
