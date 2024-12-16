import React from "react";

import * as Hub from "@/models/resourceHubs";
import { assertPresent } from "@/utils/assertions";

interface ResourceHubProps {
  resourceHub: Hub.ResourceHub;
  type: "resource_hub";
  refetch: () => void;
}

interface FolderProps {
  folder: Hub.ResourceHubFolder;
  type: "folder";
  refetch: () => void;
}

export type NodesProps = ResourceHubProps | FolderProps;

interface NodesContext {
  parent: Hub.ResourceHub | Hub.ResourceHubFolder;
  refetch: () => void;
  permissions: Hub.ResourceHubPermissions;

  locationEditingNodeId: string | undefined;
  setLocationEditingNodeId: (id: string | undefined) => void;
}

const Context = React.createContext<NodesContext | undefined>(undefined);

export function NodesProvider(props: NodesProps & { children: React.ReactNode }) {
  const [locationEditingNodeId, setLocationEditingNodeId] = React.useState<string>();
  const parent = props.type === "resource_hub" ? props.resourceHub : props.folder;

  assertPresent(parent.permissions, `permissions must be present in ${props.type}`);

  return (
    <Context.Provider
      value={{
        parent,
        refetch: props.refetch,
        permissions: parent.permissions,
        locationEditingNodeId,
        setLocationEditingNodeId,
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
