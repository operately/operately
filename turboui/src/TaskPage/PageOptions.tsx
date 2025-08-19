import { IconCopy, IconTrash, IconCopy as IconDuplicate, IconArchive } from "../icons";
import { TaskPage } from ".";

export function pageOptions(props: TaskPage.State) {
  return [
    {
      type: "action" as const,
      label: "Copy URL",
      icon: IconCopy,
    },
    {
      type: "action" as const,
      label: "Duplicate",
      onClick: props.onDuplicate,
      icon: IconDuplicate,
      hidden: !props.onDuplicate,
    },
    {
      type: "action" as const,
      label: "Archive",
      onClick: props.onArchive,
      icon: IconArchive,
      hidden: !props.onArchive,
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: () => props.onDelete(),
      icon: IconTrash,
      hidden: !props.canEdit,
    },
  ];
}