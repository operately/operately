import React from "react";
import { useTranslation } from "react-i18next";
import { WorkMap } from "..";
import { compareIds } from "../../../utils/ids";

interface Props {
  item: WorkMap.Item;
  profileUser: WorkMap.Person;
  hide?: boolean;
}

export function RoleCell({ item, profileUser, hide }: Props) {
  const { t } = useTranslation();
  if (hide) return null;

  const isChampion = item.type !== "task" && compareIds(profileUser.id, item.owner?.id);
  const isReviewer = item.type !== "task" && compareIds(profileUser.id, item.reviewer?.id);
  const isAssignee = item.type === "task" && compareIds(profileUser.id, item.owner?.id);
  const isContributor = !isAssignee && !isChampion && !isReviewer;

  if (!item.owner) return <td />;

  return (
    <td className="py-2 px-2 md:px-4 hidden xl:table-cell">
      <div className="max-w-[120px] overflow-hidden text-sm">
        {isAssignee && t("Assignee")}
        {isChampion && t("Champion")}
        {isReviewer && t("Reviewer")}
        {isContributor && t("Contributor")}
      </div>
    </td>
  );
}
