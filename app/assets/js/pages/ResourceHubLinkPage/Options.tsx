import React from "react";

import type { Page } from "turboui";
import { IconEdit, IconTrash } from "turboui";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

interface Props {
  showDeleteModal: () => void;
}

export function useLinkPageOptions({ showDeleteModal }: Props): Page.Option[] {
  const { link } = useLoadedData();
  const paths = usePaths();

  assertPresent(link.permissions, "permissions must be present in link");

  return React.useMemo(
    () => [
      {
        type: "link",
        icon: IconEdit,
        label: "Edit",
        link: paths.resourceHubEditLinkPath(link.id!),
        hidden: !link.permissions?.canEditLink,
        keepOutsideOnBigScreen: true,
        testId: "edit-link-link",
      },
      {
        type: "action",
        icon: IconTrash,
        label: "Delete",
        onClick: showDeleteModal,
        hidden: !link.permissions?.canDeleteLink,
        testId: "delete-resource-link",
      },
    ],
    [link.id, link.permissions?.canDeleteLink, link.permissions?.canEditLink, paths, showDeleteModal],
  );
}
