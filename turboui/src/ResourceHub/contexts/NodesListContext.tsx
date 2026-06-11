import * as React from "react";

import type {
  ResourceHubFolderSelectApi,
  ResourceHubFormsApi,
  ResourceHubListParent,
  ResourceHubModalApi,
  ResourceHubNodesListActions,
  ResourceHubNodesListPaths,
  ResourceHubPermissions,
} from "../types";

export interface ResourceHubNodesListContextValue {
  parent: ResourceHubListParent;
  forms: ResourceHubFormsApi;
  modal: ResourceHubModalApi;
  folderSelect: ResourceHubFolderSelectApi;
  permissions?: ResourceHubPermissions | null;
  onRefetch?: () => void;
  paths?: ResourceHubNodesListPaths;
  actions: Partial<ResourceHubNodesListActions>;
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
