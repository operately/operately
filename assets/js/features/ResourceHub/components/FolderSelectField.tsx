import React, { useState } from "react";
import { BeatLoader } from "react-spinners";
import classNames from "classnames";

import * as Hub from "@/models/resourceHubs";

import { useFieldError, useFieldValue } from "@/components/Forms/FormContext";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";
import { Node } from "@/features/ResourceHub/models";

interface Location {
  spaceId: string;
  hubId: string;
  folderId: string;
}

interface FolderSelectFieldProps {
  node: Node;
  field: string;
}

function useViewState(node: Node, field: string): ViewState {
  const [f, setValue] = useFieldValue<Location>(field);
  const [loading, setLoading] = useState<string | undefined>(undefined);
  const [location, setCurrentLocation] = useState<Hub.ResourceHubFolder | Hub.ResourceHub>(node.resource);
  const [nodes, setNodes] = useState<Node[]>([]);

  const selectFolder = (id: string) => {
    setLoading(id);

    Hub.getResourceHubFolder({ id, includeNodes: true, includePathToFolder: true, includeResourceHub: true })
      .then((res) => {
        setCurrentLocation(res.folder!);
        setNodes(res.folder!.nodes!);
        setValue({
          spaceId: node.spaceId,
          hubId: node.hubId,
          folderId: id,
        });
      })
      .finally(() => setLoading(undefined));
  };

  const selectResourceHub = (id: string) => {
    setLoading(id);

    Hub.getResourceHub({ id, includeNodes: true })
      .then((res) => {
        setCurrentLocation(res.resourceHub!);
        setNodes(res.resourceHub!.nodes!);
        setValue({
          spaceId: node.spaceId,
          hubId: id,
          folderId: "",
        });
      })
      .finally(() => setLoading(undefined));
  };

  const select = (node: Node) => {
    if (node.type === "folder") {
      selectFolder(node.id);
    } else {
      selectResourceHub(node.id);
    }
  };

  return {
    location,
    loading,
    select,
    nodes,
  };
}

interface ViewState {
  location: Hub.ResourceHubFolder | Hub.ResourceHub;
  loading: string | undefined;
  select: (node: Node) => void;
  nodes: Node[];
}

export function FolderSelectField({ node, field }: FolderSelectFieldProps) {
  const state = useViewState(node, field);

  return (
    <div>
      <Header state={state} />
      <OptionsList state={state} />
      <Error field={field} />
    </div>
  );
}

function Header({ state }: { state: ViewState }) {
  return (
    <div className="h-8 flex items-center gap-2 pb-2 border-b border-stroke-base">
      <div className="text-lg">{state.location.name}</div>
    </div>
  );
}

function OptionsList({ state }: { state: ViewState }) {
  return (
    <div className="h-[240px] overflow-scroll">
      {state.nodes.map((node) => (
        <Option node={node} state={state} />
      ))}
    </div>
  );
}

function Option({ node, state }: { node: Node; state: ViewState }) {
  // const isFolder = node.type === "folder";
  const disabled = true; // !isFolder || loading || resource.id === node.folder?.id;
  const loading = state.loading == node.id;

  const className = classNames("flex items-center justify-between p-2", {
    "cursor-pointer hover:bg-surface-highlight": loading,
    "opacity-40": disabled,
  });

  return (
    <div className={className} onClick={() => state.select(node)} data-test-id={node.testId}>
      <div className="flex items-center gap-2">
        <NodeIcon size={18} node={node} />
        {node.name}
      </div>

      {loading && <BeatLoader size={7} />}
    </div>
  );
}

function Error({ field }: { field: string }) {
  const error = useFieldError(field);

  if (!error) return <></>;

  return <div className="translate-y-6 text-sm text-red-500">{error}</div>;
}
