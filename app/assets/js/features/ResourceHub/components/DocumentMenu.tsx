import React from "react";

import * as Hub from "@/models/resourceHubs";

import { useNodesContext } from "@/features/ResourceHub";
import { useBoolState } from "@/hooks/useBoolState";
import { downloadMarkdown, exportToMarkdown } from "@/utils/markdown";
import { createTestId } from "@/utils/testid";
import { Menu, MenuActionItem, MenuLinkItem } from "turboui";
import { CopyDocumentModal } from "./CopyDocumentModal";
import { CopyResourceMenuItem } from "./CopyResource";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

interface Props {
  document: Hub.ResourceHubDocument;
}

export function DocumentMenu({ document }: Props) {
  const { permissions, parent } = useNodesContext();

  const [showMoveForm, toggleMoveForm] = useBoolState(false);
  const [showCopyForm, toggleCopyForm] = useBoolState(false);

  const relevantPermissions = [
    permissions.canEditDocument,
    permissions.canCreateDocument,
    permissions.canEditParentFolder,
    permissions.canDeleteDocument,
  ];
  const menuId = createTestId("menu", document.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canEditDocument && <EditDocumentMenuItem document={document} />}
        {permissions.canCreateDocument && <CopyResourceMenuItem resource={document} showModal={toggleCopyForm} />}
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={document} showModal={toggleMoveForm} />}
        {permissions.canView && <ExportMarkdownMenuItem document={document} />}
        {permissions.canDeleteDocument && <DeleteDocumentMenuItem document={document} />}
      </Menu>

      <MoveResourceModal resource={document} resourceType="document" isOpen={showMoveForm} hideModal={toggleMoveForm} />
      <CopyDocumentModal parent={parent} resource={document} isOpen={showCopyForm} hideModal={toggleCopyForm} />
    </>
  );
}

function EditDocumentMenuItem({ document }: Props) {
  const editPath = paths.resourceHubEditDocumentPath(document.id!);
  const editId = createTestId("edit", document.id!);

  return (
    <MenuLinkItem to={editPath} testId={editId}>
      Edit
    </MenuLinkItem>
  );
}

function DeleteDocumentMenuItem({ document }: Props) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubDocument();

  const handleDelete = async () => {
    await remove({ documentId: document.id });
    refetch();
  };
  const deleteId = createTestId("delete", document.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}

function ExportMarkdownMenuItem({ document }: Props) {
  const handleExport = () => {
    const content = JSON.parse(document.content!);
    const markdown = exportToMarkdown(content, { removeEmbeds: true });
    downloadMarkdown(markdown, document.name || "document");
  };

  return (
    <MenuActionItem onClick={handleExport} testId={createTestId("export-markdown", document.id!)}>
      Export as Markdown
    </MenuActionItem>
  );
}
