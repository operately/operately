import React from "react";

import { usePaths } from "@/routes/paths";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { assertPresent } from "@/utils/assertions";

import { downloadMarkdown, exportToMarkdown } from "@/utils/markdown";
import { IconCopy, IconEdit, IconFileExport, IconTrash } from "@tabler/icons-react";
import { useLoadedData } from "./loader";

interface Props {
  showCopyModal: () => void;
  showDeleteModal: () => void;
}

export function Options({ showCopyModal, showDeleteModal }: Props) {
  const paths = usePaths();
  const { document } = useLoadedData();
  assertPresent(document.permissions, "permissions must be present in document");

  return (
    <PageOptions.Root testId="options-button">
      {document.permissions.canEditDocument && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={paths.resourceHubEditDocumentPath(document.id!)}
          testId="edit-document-link"
          keepOutsideOnBigScreen
        />
      )}
      {document.permissions.canCreateDocument && <CopyLink showCopyModal={showCopyModal} />}
      {document.permissions.canView && <ExportMarkdownAction />}
      {document.permissions.canDeleteDocument && <DeleteAction onClick={showDeleteModal} />}
    </PageOptions.Root>
  );
}

function CopyLink({ showCopyModal }) {
  return <PageOptions.Action icon={IconCopy} title="Copy" onClick={showCopyModal} testId="copy-document-link" />;
}

function DeleteAction({ onClick }: { onClick: () => void }) {
  return <PageOptions.Action icon={IconTrash} title="Delete" onClick={onClick} testId="delete-resource-link" />;
}

function ExportMarkdownAction() {
  const { document } = useLoadedData();

  const handleExport = () => {
    const content = JSON.parse(document.content!);
    const markdown = exportToMarkdown(content, { removeEmbeds: true });
    downloadMarkdown(markdown, document.name || "document");
  };

  return (
    <PageOptions.Action
      icon={IconFileExport}
      title="Export as Markdown"
      onClick={handleExport}
      testId="export-markdown"
    />
  );
}
