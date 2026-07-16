import React from "react";

import { WorkMap } from "..";
import FormattedTime, { type FormattedTimePreferences } from "../../../FormattedTime";

interface Props {
  assignedAt: WorkMap.Item["assignedAt"];
  hide?: boolean;
  formattedTimePreferences: FormattedTimePreferences;
}

export function AssignedDateCell({ assignedAt, hide, formattedTimePreferences }: Props) {
  if (hide) return null;

  return (
    <td className="py-2 px-2 md:px-4 hidden lg:table-cell">
      {assignedAt ? (
        <span className="text-xs sm:text-sm whitespace-nowrap text-content-base">
          <FormattedTime {...formattedTimePreferences} time={assignedAt} format="short-date" />
        </span>
      ) : (
        <span className="text-sm text-content-dimmed">N/A</span>
      )}
    </td>
  );
}
