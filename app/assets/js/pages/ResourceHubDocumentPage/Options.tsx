import React from "react";

import type { Page } from "turboui";
import { IconCopy, IconEdit, IconFileExport, IconHistory, IconTrash } from "turboui";

import * as Companies from "@/models/companies";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { downloadMarkdown, exportToMarkdown } from "@/utils/markdown";

import { useLoadedData } from "./loader";

interface Props {
  showCopyModal: () => void;
  showDeleteModal: () => void;
}

export function useDocumentPageOptions({ showCopyModal, showDeleteModal }: Props): Page.Option[] {
  const paths = usePaths();
  const { document } = useLoadedData();
  const { company } = useCompanyLoaderData();

  assertPresent(document.permissions, "permissions must be present in document");

  const documentVersionsEnabled = Companies.hasFeature(company, "document-versions");

  return React.useMemo(() => {
    const options: Page.Option[] = [
      {
        type: "link",
        icon: IconEdit,
        label: "Edit",
        link: paths.resourceHubEditDocumentPath(document.id!),
        hidden: !document.permissions?.canEditDocument,
        testId: "edit-document-link",
      },
      {
        type: "action",
        icon: IconCopy,
        label: "Copy",
        onClick: showCopyModal,
        hidden: !document.permissions?.canCreateDocument,
        testId: "copy-document-link",
      },
      {
        type: "link",
        icon: IconHistory,
        label: "History of changes",
        link: paths.resourceHubDocumentVersionsPath(document.id!),
        hidden: !documentVersionsEnabled || !document.permissions?.canView,
        testId: "version-history-link",
      },
      {
        type: "action",
        icon: IconFileExport,
        label: "Export as Markdown",
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
        label: "Delete",
        onClick: showDeleteModal,
        hidden: !document.permissions?.canDeleteDocument,
        testId: "delete-resource-link",
      },
    ];

    return options;
  }, [
    document.content,
    document.id,
    document.name,
    document.permissions?.canCreateDocument,
    document.permissions?.canDeleteDocument,
    document.permissions?.canEditDocument,
    document.permissions?.canView,
    documentVersionsEnabled,
    paths,
    showCopyModal,
    showDeleteModal,
  ]);
}
