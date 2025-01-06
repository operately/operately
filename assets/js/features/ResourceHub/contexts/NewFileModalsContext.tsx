import React from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";
import { Paths } from "@/routes/paths";

import { LinkOptions } from "@/features/ResourceHub";
import { useAddFile, AddFileProps } from "../useAddFile";

interface Props {
  children: NonNullable<React.ReactNode>;
  resourceHub: ResourceHub;
  folder?: ResourceHubFolder;
}

interface NewFileModalsContext extends AddFileProps {
  showAddFolder: boolean;
  toggleShowAddFolder: () => void;
  navigateToNewDocument: () => void;
  navigateToNewLink: (type?: string) => void;
}

const Context = React.createContext<NewFileModalsContext | undefined>(undefined);

export function NewFileModalsProvider({ children, resourceHub, folder }: Props) {
  const navigate = useNavigate();
  const [showAddFolder, setShowAddFolder] = React.useState(false);
  const fileProps = useAddFile();

  const toggleShowAddFolder = () => setShowAddFolder(!showAddFolder);
  const navigateToNewDocument = () =>
    navigate(Paths.resourceHubNewDocumentPath(resourceHub.id!, folder?.id || undefined));

  const navigateToNewLink = (type?: LinkOptions) => {
    navigate(
      Paths.resourceHubNewLinkPath(resourceHub.id!, {
        folderId: folder?.id || undefined,
        type: type,
      }),
    );
  };

  return (
    <Context.Provider
      value={{
        showAddFolder,
        toggleShowAddFolder,
        navigateToNewDocument,
        navigateToNewLink,
        ...fileProps,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useNewFileModalsContext() {
  const context = React.useContext(Context);

  if (context === undefined) {
    throw new Error("useNewFileModalsContext must be used within a NewFileModalsProvider");
  }
  return context;
}
