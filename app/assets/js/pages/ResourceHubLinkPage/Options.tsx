import React from "react";
import { useTranslation } from "react-i18next";

import type { Page } from "turboui";
import { IconEdit, IconTrash } from "turboui";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

interface Props {
  showDeleteModal: () => void;
}

export function useLinkPageOptions({ showDeleteModal }: Props): Page.Option[] {
  const { t } = useTranslation();
  const { link } = useLoadedData();
  const paths = usePaths();

  assertPresent(link.permissions, "permissions must be present in link");

  return React.useMemo(
    () => [
      {
        type: "link",
        icon: IconEdit,
        label: t("Edit"),
        link: paths.resourceHubEditLinkPath(link.id!),
        hidden: !link.permissions?.canEditLink,
        keepOutsideOnBigScreen: true,
        testId: "edit-link-link",
      },
      {
        type: "action",
        icon: IconTrash,
        label: t("Delete"),
        onClick: showDeleteModal,
        hidden: !link.permissions?.canDeleteLink,
        testId: "delete-resource-link",
      },
    ],
    [t, link.id, link.permissions?.canDeleteLink, link.permissions?.canEditLink, paths, showDeleteModal],
  );
}
