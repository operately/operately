import * as React from "react";
import { BeatLoader } from "react-spinners";

import { InputField } from "../Forms";
import { IconArrowLeft } from "../icons";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export function FolderSelectField(props: FolderSelectField.Props) {
  return (
    <InputField label={props.label} field={props.field} error={props.error}>
      <div className="border border-surface-outline rounded-lg">
        <Navigation current={props.current} onGoBack={props.onGoBack} />
        <NodeList nodes={props.nodes} />
      </div>
    </InputField>
  );
}

export namespace FolderSelectField {
  export interface Node {
    id: string;
    name: string;
    selectable: boolean;
    loading?: boolean;
    icon: React.ReactNode;
    onSelect: () => void;
  }

  export interface Props {
    label: string;
    field: string;
    error?: string;
    current: { id: string; name: string } | null;
    onGoBack?: () => void;
    nodes: Node[];
  }
}

function Navigation({ current, onGoBack }: { current: FolderSelectField.Props["current"]; onGoBack?: () => void }) {
  if (!current) return <></>;

  return (
    <div className="h-8 flex items-center gap-2 p-2 border-b border-stroke-base">
      {onGoBack && (
        <IconArrowLeft className="cursor-pointer" size={16} onClick={onGoBack} data-test-id="folder-select-go-back" />
      )}
      <div className="text-sm" data-test-id={createTestId("folder-select-current", current.id)}>
        {current.name}
      </div>
    </div>
  );
}

function NodeList({ nodes }: { nodes: FolderSelectField.Node[] }) {
  return (
    <div className="h-[240px] overflow-auto">
      {nodes.map((node) => (
        <NodeItem node={node} key={node.id} />
      ))}
    </div>
  );
}

function NodeItem({ node }: { node: FolderSelectField.Node }) {
  const className = classNames("flex items-center justify-between", "p-2", "even:bg-surface-dimmed", {
    "cursor-pointer": node.selectable,
    "hover:bg-surface-highlight": !node.loading,
  });
  const innerClassName = classNames("flex items-center gap-2 text-sm", {
    "opacity-40": !node.selectable,
  });

  return (
    <div
      className={className}
      onClick={() => node.selectable && node.onSelect()}
      data-test-id={node.selectable ? createTestId("folder-select-node", node.id) : undefined}
    >
      <div className={innerClassName}>
        {node.icon}
        {node.name}
      </div>

      {node.loading && <BeatLoader size={4} />}
    </div>
  );
}
