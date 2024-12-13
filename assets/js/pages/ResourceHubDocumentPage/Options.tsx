import React from "react";
import { useNavigate } from "react-router-dom";

import * as PageOptions from "@/components/PaperContainer/PageOptions";
import { useDeleteResourceHubDocument } from "@/models/resourceHubs";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { IconEdit, IconTrash } from "@tabler/icons-react";

export function Options() {
  const { document } = useLoadedData();
  assertPresent(document.permissions, "permissions must be present in document");

  return (
    <PageOptions.Root testId="document-options-button" position="top-right">
      {document.permissions.canEditDocument && (
        <PageOptions.Link
          icon={IconEdit}
          title="Edit document"
          to={Paths.resourceHubEditDocumentPath(document.id!)}
          testId="edit-document-link"
        />
      )}
      {document.permissions.canDeleteDocument && <DeleteAction />}
    </PageOptions.Root>
  );
}

function DeleteAction() {
  const { document } = useLoadedData();
  const [remove] = useDeleteResourceHubDocument();
  const navigate = useNavigate();

  const handleDelete = async () => {
    remove({ documentId: document.id }).then(() => {
      assertPresent(document.resourceHub, "resourceHub must be present in document");
      navigate(Paths.resourceHubPath(document.resourceHub.id!));
    });
  };

  return <PageOptions.Action icon={IconTrash} title="Delete" onClick={handleDelete} testId="delete-document-link" />;
}
