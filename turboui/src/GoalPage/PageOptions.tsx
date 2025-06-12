import { IconCircleArrowRight, IconCircleCheck, IconTrash } from "@tabler/icons-react";
import { GoalPage } from ".";

export function pageOptions(props: GoalPage.State) {
  return [
    {
      type: "link" as const,
      label: "Close Goal",
      link: props.closeLink,
      icon: IconCircleCheck,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "action" as const,
      label: "Move to another space",
      onClick: props.openMoveModal,
      icon: IconCircleArrowRight,
      hidden: !props.canEdit,
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
