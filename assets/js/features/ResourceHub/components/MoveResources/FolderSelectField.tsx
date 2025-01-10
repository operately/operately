import React, { useMemo, useState } from "react";
import { BeatLoader } from "react-spinners";
import classNames from "classnames";

import * as Hub from "@/models/resourceHubs";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";

import { sortNodesWithFoldersFirst } from "@/features/ResourceHub/utils";
import { useFieldError, useFieldValue } from "@/components/Forms/FormContext";
import { NodeIcon } from "@/features/ResourceHub/NodeIcon";
import { InputField } from "@/components/Forms/FieldGroup";

import { MovableResource } from ".";
import { DecoratedNode, Location, decorateNodes } from "../../DecoratedNode";

interface FolderSelectFieldProps {
  node: DecoratedNode;
  field: string;
  label: string;
  hidden?: boolean;
}

// const selectFolder = (id: string) => {
//   setLoading(id);

//   Hub.getResourceHubFolder({ id, includeNodes: true, includePathToFolder: true, includeResourceHub: true })
//     .then((res) => {
//       setCurrentLocation(res.folder!);
//       setValue(res.folder?.id!);
//     })
//     .finally(() => setLoading(undefined));
// };

// const selectResourceHub = (id: string) => {
//   setLoading(id);

//   Hub.getResourceHub({ id, includeNodes: true })
//     .then((res) => {
//       setCurrentLocation(res.resourceHub!);
//       setValue(null);
//     })
//     .finally(() => setLoading(undefined));
// };

type ChangePathFn = (callback: (path: Location[]) => Location[]) => void;

export function FolderSelectField({ node, field, label, hidden }: FolderSelectFieldProps) {
  const [path, setValue] = useFieldValue<Location[]>(field);
  const [loading, setLoading] = useState<string>();

  const error = useFieldError(field);

  const changePath = (callback: (path: Location[]) => Location[]) => {
    setValue(callback(path));
  };

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <div className="border border-surface-outline rounded-lg">
        <Header path={path} changePath={changePath} loading={loading} />

        <div className="h-[240px] overflow-scroll text-sm">
          <OptionsList location={path[path.length - 1]!} changePath={changePath} loading={loading} />
        </div>
      </div>
    </InputField>
  );
}

interface HeaderProps {
  path: Location[];
  changePath: ChangePathFn;
  loading: string | undefined;
}

function Header({ path, changePath, loading }: HeaderProps) {
  // const isCurrentLocationFolder = "pathToFolder" in currentLocation;

  // const goBack = () => {
  //   if (!isCurrentLocationFolder || loading) return;

  //   assertPresent(currentLocation.pathToFolder, "pathToFolder must be present in folder");
  //   assertPresent(currentLocation.resourceHub, "resourceHub must be present in folder");

  //   if (currentLocation.pathToFolder.length > 0) {
  //     const lastFolder = currentLocation.pathToFolder.pop();
  //     selectFolder(lastFolder?.id!);
  //   } else {
  //     selectResourceHub(currentLocation.resourceHub.id!);
  //   }
  // };

  const changePathTo = (location: Location) => {
    changePath((prev) => {
      const idx = prev.findIndex((loc) => loc.index === location.index);
      return prev.slice(0, idx + 1);
    });
  };

  return (
    <div className="flex items-center gap-2 p-2 pl-3 border-b border-stroke-base">
      <div className="font-medium text-sm inline-flex items-center gap-1 h-5">
        {path.map((location, idx) => (
          <HeaderElement
            location={location}
            key={idx}
            last={idx === path.length - 1}
            onClick={() => changePathTo(location)}
          />
        ))}
      </div>
    </div>
  );
}

function HeaderElement({ location, last, onClick }: { location: Location; last: boolean; onClick: () => void }) {
  if (location.type === "home") {
    return <Icons.IconHomeFilled size={14} className="cursor-pointer" onClick={onClick} />;
  } else {
    const className = classNames("hover:underline underline-offset-2 cursor-pointer", { "font-bold": last });

    return (
      <>
        <Icons.IconChevronRight size={14} />
        <span className={className} onClick={onClick}>
          {location.name}
        </span>
      </>
    );
  }
}

interface OptionsListProps {
  location: Location;
  changePath: ChangePathFn;
  loading: string | undefined;
}

function OptionsList({ location, loading, changePath }: OptionsListProps) {
  // const options = useMemo(() => sortNodesWithFoldersFirst(currentLocation.nodes!), [currentLocation]);

  // return (
  //   <div className="h-[240px] overflow-scroll text-sm">
  //     {options?.map((node, idx) => (
  //       <Option
  //         resource={resource}
  //         node={node}
  //         loading={loading}
  //         callback={() => selectFolder(node.folder?.id!)}
  //         testid={`node-${idx}`}
  //         key={node.id}
  //       />
  //     ))}
  //   </div>
  // );

  if (location.type === "home") {
    return <OptionsListInHome loading={loading} changePath={changePath} />;
  }

  if (location.type === "space") {
    return <OptionsListInSpace space={location.resource as Spaces.Space} loading={loading} changePath={changePath} />;
  }

  if (location.type === "resourceHub") {
    return (
      <OptionsListInResourceHub hub={location.resource as Hub.ResourceHub} loading={loading} changePath={changePath} />
    );
  }

  if (location.type === "folder") {
    return (
      <OptionsListInFolder
        folder={location.resource as Hub.ResourceHubFolder}
        loading={loading}
        changePath={changePath}
      />
    );
  }
}

function OptionsListInResourceHub({ hub, changePath }: { hub: Hub.ResourceHub; changePath: ChangePathFn }) {
  const { data } = Hub.useGetResourceHub({
    id: hub.id,
    includeNodes: true,
    includeSpace: true,
    includeCommentsCount: true,
  });

  const options = useMemo(() => {
    if (!data?.resourceHub?.nodes) return [];

    const decorated = decorateNodes(data.resourceHub.space!, data.resourceHub, data.resourceHub.nodes);
    const sorted = sortNodesWithFoldersFirst(decorated);

    return sorted;
  }, [data]);

  if (!data?.resourceHub?.nodes) return null;

  return (
    <div className="h-[240px] overflow-scroll text-sm">
      {options?.map((node, idx) => (
        <OptionNode
          node={node}
          changePath={changePath}
          testid={`node-${idx}`}
          key={node.id}
          loading={undefined}
          disabled={false}
        />
      ))}
    </div>
  );
}

function OptionsListInFolder({ folder, changePath }: { folder: Hub.ResourceHubFolder; changePath: ChangePathFn }) {
  const { data } = Hub.useGetResourceHubFolder({ id: folder.id, includeNodes: true });

  const options = useMemo(() => {
    if (!data?.folder?.nodes) return [];

    return data.folder.nodes;
  }, [data]);

  if (!data?.folder?.nodes) return null;

  return (
    <div className="h-[240px] overflow-scroll text-sm">
      {options?.map((node, idx) => (
        <OptionNode
          node={node}
          changePath={changePath}
          testid={`node-${idx}`}
          key={node.id}
          loading={undefined}
          disabled={false}
        />
      ))}
    </div>
  );
}

function OptionsListInHome({ changePath }: { loading: string | undefined; changePath: ChangePathFn }) {
  const { data } = Spaces.useGetSpaces({});

  if (!data?.spaces) return null;

  const changePathTo = (space: Spaces.Space) => {
    changePath((path: Location[]) => [
      ...path,
      { index: path.length, name: space.name, type: "space", resource: space } as Location,
    ]);
  };

  return (
    <div className="h-[240px] overflow-scroll text-sm">
      {data!.spaces.map((space, idx) => (
        <OptionSpace testId={`space-${idx}`} space={space} key={space.id} onClick={() => changePathTo(space)} />
      ))}
    </div>
  );
}

function OptionSpace({ space, onClick, testId }: { space: Spaces.Space; onClick: () => void; testId: string }) {
  const className = classNames("flex items-center justify-between py-1.5 px-2 mx-0.5 even:bg-surface-dimmed");

  const handleClick = () => {
    onClick();
  };

  return (
    <div className={className} onClick={handleClick} data-test-id={testId}>
      <div className="flex items-center gap-2 cursor-pointer">{space.name}</div>
    </div>
  );
}

function OptionHub({ hub, onClick, testId }: { hub: Hub.ResourceHub; onClick: () => void; testId: string }) {
  const className = classNames("flex items-center justify-between py-1.5 px-2 mx-0.5 even:bg-surface-dimmed");

  const handleClick = () => {
    onClick();
  };

  return (
    <div className={className} onClick={handleClick} data-test-id={testId}>
      <div className="flex items-center gap-2 cursor-pointer">{hub.name}</div>
    </div>
  );
}

function OptionsListInSpace({ space, changePath }: { space: Spaces.Space; changePath: ChangePathFn }) {
  const { data } = Spaces.useListSpaceTools({ spaceId: space.id });

  if (!data?.tools?.resourceHubs) return null;
  if (data?.tools?.resourceHubs.length === 0) return null;

  const changePathTo = (hub: Hub.ResourceHub) => {
    changePath((path: Location[]) => [
      ...path,
      { index: path.length, name: hub.name, type: "resourceHub", resource: hub } as Location,
    ]);
  };

  return data!.tools.resourceHubs.map((hub, idx) => (
    <OptionHub testId={`hub-${idx}`} hub={hub} key={hub.id} onClick={() => changePathTo(hub)} />
  ));
}

interface OptionProps {
  node: DecoratedNode;
  loading: string | undefined;
  changePath: ChangePathFn;
  testid: string;
  disabled: boolean;
}

function OptionNode({ node, changePath, loading, testid, disabled }: OptionProps) {
  // const disabled = !isFolder || loading || resource.id === node.folder?.id;

  const className = classNames(
    "flex items-center justify-between py-1.5 px-2 mx-0.5 even:bg-surface-dimmed",
    !loading && "cursor-pointer hover:bg-surface-highlight",
    {
      "cursor-pointer": node.type === "folder",
      "opacity-50": node.type !== "folder",
    },
  );

  const onClick = () => {


  const changePathTo = () => {
    changePath((prev) => [...prev, { index: prev.length, name: node.name!, type: "folder", resource: node.resource! }]);
  };

  return (
    <div className={className} onClick={changePathTo} data-test-id={testid}>
      <div className="flex items-center gap-2" style={{ opacity: disabled ? 0.5 : 1 }}>
        <NodeIcon size={18} node={node.rawNode} />
        {node.name}
      </div>
    </div>
  );
}
