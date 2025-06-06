import React from "react";
import { useNavigate } from "react-router-dom";

import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { useDeleteResourceHubDocument } from "@/models/resourceHubs";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { IconCopy, IconEdit, IconTrash, IconFileExport } from "@tabler/icons-react";
import { downloadMarkdown, exportToMarkdown } from "@/utils/markdown";

interface Props {
  showCopyModal: () => void;
}

export function Options({ showCopyModal }: Props) {
  const { document } = useLoadedData();
  assertPresent(document.permissions, "permissions must be present in document");

  return (
    <PageOptions.Root testId="options-button">
      {document.permissions.canEditDocument && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={Paths.resourceHubEditDocumentPath(document.id!)}
          testId="edit-document-link"
          keepOutsideOnBigScreen
        />
      )}
      {document.permissions.canCreateDocument && <CopyLink showCopyModal={showCopyModal} />}
      {document.permissions.canView && <ExportMarkdownAction />}
      {document.permissions.canDeleteDocument && <DeleteAction />}
    </PageOptions.Root>
  );
}

function CopyLink({ showCopyModal }) {
  return <PageOptions.Action icon={IconCopy} title="Copy" onClick={showCopyModal} testId="copy-document-link" />;
}

function DeleteAction() {
  const { document, folder, resourceHub } = useLoadedData();
  const [remove] = useDeleteResourceHubDocument();
  const navigate = useNavigate();

  const redirect = () => {
    if (folder) {
      navigate(Paths.resourceHubFolderPath(folder.id!));
    } else {
      navigate(Paths.resourceHubPath(resourceHub.id!));
    }
  };

  const handleDelete = async () => {
    await remove({ documentId: document.id });
    redirect();
  };

  return <PageOptions.Action icon={IconTrash} title="Delete" onClick={handleDelete} testId="delete-resource-link" />;
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
