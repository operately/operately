import React from "react";
import { useTranslation } from "react-i18next";

import type { Page } from "turboui";
import { IconCopy, IconEdit, IconFileExport, IconHistory, IconTrash, IconLink } from "turboui";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { downloadMarkdown, exportToMarkdown } from "@/utils/markdown";

import { useLoadedData } from "./loader";

interface Props {
  showCopyModal: () => void;
  showDeleteModal: () => void;
  showPublicSharingModal: () => void;
}

export function useDocumentPageOptions({
  showCopyModal,
  showDeleteModal,
  showPublicSharingModal,
}: Props): Page.Option[] {
  const { t } = useTranslation();
  const paths = usePaths();
  const { document } = useLoadedData();

  assertPresent(document.permissions, "permissions must be present in document");

  return React.useMemo(() => {
    const options: Page.Option[] = [
      {
        type: "action",
        icon: IconLink,
        label: document.publicUrl ? t("Manage public sharing") : t("Share publicly"),
        onClick: showPublicSharingModal,
        hidden: document.state !== "published" || !document.permissions?.canEditDocument,
        testId: "share-document-publicly",
      },
      {
        type: "link",
        icon: IconEdit,
        label: t("Edit"),
        link: paths.resourceHubEditDocumentPath(document.id!),
        hidden: !document.permissions?.canEditDocument,
        keepOutsideOnBigScreen: true,
        testId: "edit-document-link",
      },
      {
        type: "action",
        icon: IconCopy,
        label: t("Copy"),
        onClick: showCopyModal,
        hidden: !document.permissions?.canCreateDocument,
        testId: "copy-document-link",
      },
      {
        type: "link",
        icon: IconHistory,
        label: t("History of changes"),
        link: paths.resourceHubDocumentVersionsPath(document.id!),
        hidden: !document.permissions?.canView,
        testId: "version-history-link",
      },
      {
        type: "action",
        icon: IconFileExport,
        label: t("Export as Markdown"),
        onClick: () => {
          const content = JSON.parse(document.content!);
          const markdown = exportToMarkdown(content, { removeEmbeds: true });
          downloadMarkdown(markdown, document.name || "document");
        },
        hidden: !document.permissions?.canView,
        testId: "export-markdown",
      },
      {
        type: "action",
        icon: IconTrash,
        label: t("Delete"),
        onClick: showDeleteModal,
        hidden: !document.permissions?.canDeleteDocument,
        testId: "delete-resource-link",
      },
    ];

    return options;
  }, [
    t,
    document.content,
    document.state,
    document.publicUrl,
    document.id,
    document.name,
    document.permissions?.canCreateDocument,
    document.permissions?.canDeleteDocument,
    document.permissions?.canEditDocument,
    document.permissions?.canView,
    paths,
    showCopyModal,
    showDeleteModal,
    showPublicSharingModal,
  ]);
}
