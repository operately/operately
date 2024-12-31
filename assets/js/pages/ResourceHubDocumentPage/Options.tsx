import React from "react";
import { useNavigate } from "react-router-dom";

import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { useDeleteResourceHubDocument } from "@/models/resourceHubs";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { IconCopy, IconEdit, IconTrash } from "@tabler/icons-react";

export function Options() {
  const { document } = useLoadedData();
  assertPresent(document.permissions, "permissions must be present in document");

  return (
    <PageOptions.Root testId="document-options-button" position="top-right">
      {document.permissions.canEditDocument && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit"
          to={Paths.resourceHubEditDocumentPath(document.id!)}
          testId="edit-document-link"
        />
      )}
      {document.permissions.canCreateDocument && <CopyLink />}
      {document.permissions.canDeleteDocument && <DeleteAction />}
    </PageOptions.Root>
  );
}

function CopyLink() {
  const { document } = useLoadedData();
  const parentId = document.parentFolderId || document.resourceHubId!;
  const parentType = document.parentFolderId ? "folder" : "resource_hub";

  return (
    <PageOptions.Link
      icon={IconCopy}
      title="Copy"
      to={Paths.resourceHubCopyDocumentPath(document.id!, parentId, parentType)}
      testId="copy-document-link"
    />
  );
}

function DeleteAction() {
  const { document } = useLoadedData();
  const [remove] = useDeleteResourceHubDocument();
  const navigate = useNavigate();

  const redirect = () => {
    if (document.parentFolder) {
      navigate(Paths.resourceHubFolderPath(document.parentFolder.id!));
    } else {
      assertPresent(document.resourceHub, "resourceHub must be present in document");
      navigate(Paths.resourceHubPath(document.resourceHub.id!));
    }
  };

  const handleDelete = async () => {
    await remove({ documentId: document.id });
    redirect();
  };

  return <PageOptions.Action icon={IconTrash} title="Delete" onClick={handleDelete} testId="delete-document-link" />;
}
