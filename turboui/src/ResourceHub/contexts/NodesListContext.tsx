import * as React from "react";

import type {
  CopyDocumentArgs,
  CopyFolderArgs,
  MoveResourceArgs,
  ResourceHubFolderSelectFieldProps,
  ResourceHubFormsApi,
  ResourceHubListParent,
  ResourceHubListPermissions,
  ResourceHubModalApi,
} from "../types";

export interface ResourceHubNodesListContextValue {
  permissions: ResourceHubListPermissions;
  parent: ResourceHubListParent;
  onRefetch: () => void;
  paths: {
    editDocumentPath: (id: string) => string;
    editFilePath: (id: string) => string;
    editLinkPath: (id: string) => string;
    documentPath: (id: string) => string;
    folderPath: (id: string) => string;
  };
  actions: {
    deleteDocument: (id: string) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
    deleteLink: (id: string) => Promise<void>;
    renameFolder: (id: string, name: string) => Promise<void>;
    moveResource: (args: MoveResourceArgs) => Promise<void>;
    copyDocument: (args: CopyDocumentArgs) => Promise<void>;
    copyFolder: (args: CopyFolderArgs) => Promise<void>;
    downloadFile: (url: string, name: string) => void;
    exportDocumentMarkdown: (content: string, name: string) => void;
  };
  forms: ResourceHubFormsApi;
  modal: ResourceHubModalApi;
  components: {
    FolderSelectField: React.ComponentType<ResourceHubFolderSelectFieldProps>;
  };
}

const Context = React.createContext<ResourceHubNodesListContextValue | undefined>(undefined);

export function ResourceHubNodesListProvider({
  value,
  children,
}: {
  value: ResourceHubNodesListContextValue;
  children: React.ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useResourceHubNodesListContext() {
  const context = React.useContext(Context);

  if (context === undefined) {
    throw new Error("useResourceHubNodesListContext must be used within a ResourceHubNodesListProvider");
  }

  return context;
}
