import React, { useMemo, useState } from "react";
import { BeatLoader } from "react-spinners";
import classNames from "classnames";

import * as Hub from "@/models/resourceHubs";

import { IconArrowLeft } from "@tabler/icons-react";
import { findIcon, NodeType } from "@/features/ResourceHub/utils";
import { useFieldError, useFieldValue } from "@/components/Forms/FormContext";
import { assertPresent } from "@/utils/assertions";

import { Location, MovableResource } from ".";

interface FolderSelectFieldProps {
  resource: MovableResource;
  field: string;
  startLocation: Location;
}

export function FolderSelectField({ resource, field, startLocation }: FolderSelectFieldProps) {
  const [_, setValue] = useFieldValue<string | null>(field);
  const [currentLocation, setCurrentLocation] = useState(startLocation);
  const [loading, setLoading] = useState<string>();

  const selectFolder = (id: string) => {
    setLoading(id);

    Hub.getResourceHubFolder({ id, includeNodes: true, includePathToFolder: true, includeResourceHub: true })
      .then((res) => {
        setCurrentLocation(res.folder!);
        setValue(res.folder?.id!);
      })
      .finally(() => setLoading(undefined));
  };

  const selectResourceHub = (id: string) => {
    setLoading(id);

    Hub.getResourceHub({ id, includeNodes: true })
      .then((res) => {
        setCurrentLocation(res.resourceHub!);
        setValue(null);
      })
      .finally(() => setLoading(undefined));
  };

  return (
    <div>
      <Header
        currentLocation={currentLocation}
        selectFolder={selectFolder}
        selectResourceHub={selectResourceHub}
        loading={loading}
      />
      <OptionsList
        resource={resource}
        currentLocation={currentLocation}
        selectFolder={selectFolder}
        loading={loading}
      />

      <Error field={field} />
    </div>
  );
}

interface HeaderProps {
  currentLocation: Location;
  selectFolder: (id: string) => void;
  selectResourceHub: (id: string) => void;
  loading: string | undefined;
}

function Header({ currentLocation, selectFolder, selectResourceHub, loading }: HeaderProps) {
  const isCurrentLocationFolder = "pathToFolder" in currentLocation;

  const goBack = () => {
    if (!isCurrentLocationFolder || loading) return;

    assertPresent(currentLocation.pathToFolder, "pathToFolder must be present in folder");
    assertPresent(currentLocation.resourceHub, "resourceHub must be present in folder");

    if (currentLocation.pathToFolder.length > 0) {
      const lastFolder = currentLocation.pathToFolder.pop();
      selectFolder(lastFolder?.id!);
    } else {
      selectResourceHub(currentLocation.resourceHub.id!);
    }
  };

  return (
    <div className="h-8 flex items-center gap-2 pb-2 border-b border-stroke-base">
      {isCurrentLocationFolder && <IconArrowLeft className="cursor-pointer" size={24} onClick={goBack} />}
      <div className="text-lg">{currentLocation.name}</div>
    </div>
  );
}

interface OptionsListProps {
  resource: MovableResource;
  currentLocation: Location;
  selectFolder: (id: string) => void;
  loading: string | undefined;
}

function OptionsList({ resource, currentLocation, selectFolder, loading }: OptionsListProps) {
  const options = useMemo(() => {
    return currentLocation.nodes?.sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return 0;
    });
  }, [currentLocation]);

  return (
    <div className="h-[240px] overflow-scroll">
      {options?.map((node) => (
        <Option
          resource={resource}
          node={node}
          loading={loading}
          callback={() => selectFolder(node.folder?.id!)}
          key={node.id}
        />
      ))}
    </div>
  );
}

interface OptionProps {
  resource: MovableResource;
  node: Hub.ResourceHubNode;
  loading: string | undefined;
  callback: (node: Hub.ResourceHubNode) => void;
}

function Option({ resource, node, callback, loading }: OptionProps) {
  const isFolder = node.type === "folder";
  const disabled = !isFolder || loading || resource.id === node.folder?.id;

  const Icon = findIcon(node.type as NodeType, node);
  const className = classNames(
    "flex items-center justify-between p-2",
    !loading && "cursor-pointer hover:bg-surface-highlight",
    disabled && "opacity-40",
  );

  const handleClick = () => {
    if (disabled) return;

    callback(node);
  };

  return (
    <div className={className} onClick={handleClick}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        {node.name}
      </div>
      {loading && loading === node.folder?.id && <BeatLoader size={7} />}
    </div>
  );
}

function Error({ field }: { field: string }) {
  const error = useFieldError(field);

  if (!error) return <></>;

  return <div className="translate-y-6 text-sm text-red-500">{error}</div>;
}
