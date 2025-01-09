import React, { useMemo, useState } from "react";
import { BeatLoader } from "react-spinners";
import classNames from "classnames";

import * as Hub from "@/models/resourceHubs";

import { IconArrowLeft } from "@tabler/icons-react";
import { sortNodesWithFoldersFirst } from "@/features/ResourceHub/utils";
import { useFieldError, useFieldValue } from "@/components/Forms/FormContext";
import { assertPresent } from "@/utils/assertions";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";
import { InputField } from "@/components/Forms/FieldGroup";

import { Location, MovableResource } from ".";

interface FolderSelectFieldProps {
  resource: MovableResource;
  field: string;
  startLocation: Location;
  label: string;
  hidden?: boolean;
}

export function FolderSelectField({ resource, field, startLocation, label, hidden }: FolderSelectFieldProps) {
  const [_, setValue] = useFieldValue<string | null>(field);
  const error = useFieldError(field);

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
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <div className="border border-surface-outline rounded-lg">
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
      </div>
    </InputField>
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
    <div className="flex items-center gap-2 p-2 border-b border-stroke-base">
      {isCurrentLocationFolder && <IconArrowLeft className="cursor-pointer" size={16} onClick={goBack} />}
      <div className="font-medium text-sm">Product / {currentLocation.name}</div>
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
  const options = useMemo(() => sortNodesWithFoldersFirst(currentLocation.nodes!), [currentLocation]);

  return (
    <div className="h-[240px] overflow-scroll text-sm">
      {options?.map((node, idx) => (
        <Option
          resource={resource}
          node={node}
          loading={loading}
          callback={() => selectFolder(node.folder?.id!)}
          testid={`node-${idx}`}
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
  testid: string;
}

function Option({ resource, node, callback, loading, testid }: OptionProps) {
  const isFolder = node.type === "folder";
  const disabled = !isFolder || loading || resource.id === node.folder?.id;

  const className = classNames(
    "flex items-center justify-between py-1.5 px-2 mx-0.5 even:bg-surface-dimmed",
    !loading && "cursor-pointer hover:bg-surface-highlight",
  );

  const handleClick = () => {
    if (disabled) return;

    callback(node);
  };

  return (
    <div className={className} onClick={handleClick} data-test-id={testid}>
      <div className="flex items-center gap-2" style={{ opacity: disabled ? 0.5 : 1 }}>
        <NodeIcon size={18} node={node} />
        {node.name}
      </div>

      {loading && loading === node.folder?.id && <BeatLoader size={7} />}
    </div>
  );
}
