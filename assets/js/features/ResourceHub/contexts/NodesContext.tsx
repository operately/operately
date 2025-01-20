import React from "react";

import { ResourceHub, ResourceHubFolder, ResourceHubNode, ResourceHubPermissions } from "@/models/resourceHubs";
import { assertPresent } from "@/utils/assertions";

interface ResourceHubProps {
  resourceHub: ResourceHub;
  type: "resource_hub";
  nodes: ResourceHubNode[];
  refetch: () => void;
}

interface FolderProps {
  folder: ResourceHubFolder;
  type: "folder";
  nodes: ResourceHubNode[];
  refetch: () => void;
}

export type NodesProps = ResourceHubProps | FolderProps;

interface NodesContext {
  parent: ResourceHub | ResourceHubFolder;
  refetch: () => void;
  permissions: ResourceHubPermissions;
}

const Context = React.createContext<NodesContext | undefined>(undefined);

export function NodesProvider(props: NodesProps & { children: React.ReactNode }) {
  const parent = props.type === "resource_hub" ? props.resourceHub : props.folder;

  assertPresent(parent.permissions, `permissions must be present in ${props.type}`);

  return (
    <Context.Provider
      value={{
        parent,
        refetch: props.refetch,
        permissions: parent.permissions,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}

export function useNodesContext() {
  const context = React.useContext(Context);

  if (context === undefined) {
    throw new Error("useNodesContext must be used within a NodesProvider");
  }
  return context;
}
