import { IconCircleCheck, IconTrash } from "@tabler/icons-react";
import { GoalPage } from ".";

export function pageOptions(props: GoalPage.State) {
  return [
    {
      type: "link" as const,
      label: "Close",
      link: props.closeLink,
      icon: IconCircleCheck,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: props.openDeleteModal,
      icon: IconTrash,
      hidden: !props.canEdit,
    },
  ];
}
