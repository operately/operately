import React from "react";
import { WorkMap } from "..";
import { compareIds } from "../../../utils/ids";

interface Props {
  item: WorkMap.Item;
  profileUser: WorkMap.Person;
  hide?: boolean;
}

export function RoleCell({ item, profileUser, hide }: Props) {
  const isChampion = compareIds(profileUser.id, item.owner?.id);
  const isReviewer = compareIds(profileUser.id, item.reviewer?.id);
  const isContributor = !isChampion && !isReviewer;

  if (hide) return null;

  if (!item.owner) return <td />;

  return (
    <td className="py-2 px-2 md:px-4 hidden xl:table-cell">
      <div className="max-w-[120px] overflow-hidden text-sm">
        {isChampion && "Champion"}
        {isReviewer && "Reviewer"}
        {isContributor && "Contributor"}
      </div>
    </td>
  );
}
