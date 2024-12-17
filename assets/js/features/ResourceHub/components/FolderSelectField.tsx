import React, { useMemo, useState } from "react";

import * as Hub from "@/models/resourceHubs";

import classNames from "classnames";
import { IconArrowLeft } from "@tabler/icons-react";
import { useFieldValue } from "@/components/Forms/FormContext";
import { assertPresent } from "@/utils/assertions";

import { findIcon, NodeType } from "../utils";

interface FolderSelectFieldProps {
  field: string;
  startLocation: Hub.ResourceHub | Hub.ResourceHubFolder;
}

export function FolderSelectField({ field, startLocation }: FolderSelectFieldProps) {
  const [_, setValue] = useFieldValue<string | null>(field);
  const [currentLocation, setCurrentLocation] = useState(startLocation);
  const [isLoading, setIsLoading] = useState(false);

  const selectFolder = (id: string) => {
    setIsLoading(true);

    Hub.getResourceHubFolder({ id, includeNodes: true, includePathToFolder: true, includeResourceHub: true })
      .then((res) => {
        setCurrentLocation(res.folder!);
        setValue(res.folder?.id!);
      })
      .finally(() => setIsLoading(false));
  };

  const selectResourceHub = (id: string) => {
    setIsLoading(true);

    Hub.getResourceHub({ id, includeNodes: true })
      .then((res) => {
        setCurrentLocation(res.resourceHub!);
        setValue(null);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div>
      <Header
        currentLocation={currentLocation}
        selectFolder={selectFolder}
        selectResourceHub={selectResourceHub}
        isLoading={isLoading}
      />
      <OptionsList currentLocation={currentLocation} selectFolder={selectFolder} isLoading={isLoading} />
    </div>
  );
}

interface HeaderProps {
  currentLocation: Hub.ResourceHub | Hub.ResourceHubFolder;
  selectFolder: (id: string) => void;
  selectResourceHub: (id: string) => void;
  isLoading: boolean;
}

function Header({ currentLocation, selectFolder, selectResourceHub }: HeaderProps) {
  const isCurrentLocationFolder = "pathToFolder" in currentLocation;

  const goBack = () => {
    if (!isCurrentLocationFolder) return;

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
  currentLocation: Hub.ResourceHub | Hub.ResourceHubFolder;
  selectFolder: (id: string) => void;
  isLoading: boolean;
}

function OptionsList({ currentLocation, selectFolder, isLoading }: OptionsListProps) {
  const options = useMemo(() => {
    return currentLocation.nodes?.sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return 0;
    });
  }, [currentLocation]);

  return (
    <div className="h-[240px]">
      {options?.map((node) => (
        <Option node={node} isLoading={isLoading} callback={() => selectFolder(node.folder?.id!)} key={node.id} />
      ))}
    </div>
  );
}

interface OptionProps {
  node: Hub.ResourceHubNode;
  isLoading: boolean;
  callback: (node: Hub.ResourceHubNode) => void;
}

function Option({ node, callback }: OptionProps) {
  const isFolder = node.type === "folder";

  const Icon = findIcon(node.type as NodeType, node);
  const className = classNames(
    "flex items-center p-2 gap-2",
    "cursor-pointer hover:bg-surface-highlight",
    !isFolder && "opacity-40",
  );

  const handleClick = () => {
    if (!isFolder) return;

    callback(node);
  };

  return (
    <div className={className} onClick={handleClick}>
      <Icon size={18} />
      {node.name}
    </div>
  );
}
