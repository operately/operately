import { useState } from "react";
import { useNavigate } from "react-router";

import { usePaths } from "@/routes/paths";
import type { NewFileModalsContextValue, ResourceHubLinkType } from "turboui";
import { useAddFile } from "turboui";

import type { ResourceHub, ResourceHubFolder } from "./index";

interface UseNewFileModalsContextValueProps {
  resourceHub?: ResourceHub | null;
  folder?: ResourceHubFolder | null;
}

export function useNewFileModalsContextValue({
  resourceHub,
  folder,
}: UseNewFileModalsContextValueProps): NewFileModalsContextValue {
  const paths = usePaths();
  const navigate = useNavigate();
  const [showAddFolder, setShowAddFolder] = useState(false);
  const fileProps = useAddFile();

  const toggleShowAddFolder = () => setShowAddFolder((value) => !value);
  const navigateToNewDocument = () => {
    if (!resourceHub?.id) return;

    navigate(paths.resourceHubNewDocumentPath(resourceHub.id, folder?.id || undefined));
  };
  const navigateToNewLink = (type?: ResourceHubLinkType) => {
    if (!resourceHub?.id) return;

    navigate(
      paths.resourceHubNewLinkPath(resourceHub.id, {
        folderId: folder?.id || undefined,
        type,
      }),
    );
  };

  return {
    showAddFolder,
    toggleShowAddFolder,
    navigateToNewDocument,
    navigateToNewLink,
    ...fileProps,
  };
}
