import i18n from "../i18n";
import { IconCopy, IconTrash, IconCopy as IconDuplicate, IconArchive } from "../icons";
import { TaskPage } from "./types";

export function pageOptions(props: TaskPage.State) {
  return [
    {
      type: "action" as const,
      label: i18n.t("Copy URL"),
      icon: IconCopy,
    },
    {
      type: "action" as const,
      label: i18n.t("Duplicate"),
      onClick: props.onDuplicate,
      icon: IconDuplicate,
      hidden: !props.onDuplicate,
    },
    {
      type: "action" as const,
      label: i18n.t("Archive"),
      onClick: props.onArchive,
      icon: IconArchive,
      hidden: !props.onArchive,
    },
    {
      type: "action" as const,
      label: i18n.t("Delete"),
      onClick: () => props.onDelete(),
      icon: IconTrash,
      hidden: !props.canEdit,
    },
  ];
}
