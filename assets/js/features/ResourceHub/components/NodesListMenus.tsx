import React from "react";

import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";
import { Node, useDeleteNode, useDownloadNode } from "@/features/ResourceHub/models";

import { RenameNodeModal } from "./RenameNodeModal";
import { MoveNodeModal } from "./MoveNodeModal";

export function DocumentMenu({ node }: { node: Node }) {
  return (
    <Menu size="medium" testId={node.menuTestId}>
      <Copy node={node} />
      <Edit node={node} />
      <Move node={node} />
      <Delete node={node} />
    </Menu>
  );
}

export function FolderMenu({ node }: { node: Node }) {
  return (
    <Menu size="medium" testId={node.menuTestId}>
      <Rename node={node} />
      <Move node={node} />
      <Delete node={node} />
    </Menu>
  );
}

export function FileMenu({ node }: { node: Node }) {
  return (
    <Menu size="medium" testId={node.menuTestId}>
      <Download node={node} />
      <Edit node={node} />
      <Move node={node} />
      <Delete node={node} />
    </Menu>
  );
}

export function LinkMenu({ node }: { node: Node }) {
  return (
    <Menu size="medium" testId={node.menuTestId}>
      <Move node={node} />
      <Edit node={node} />
      <Delete node={node} />
    </Menu>
  );
}

function Download({ node }: { node: Node }) {
  const download = useDownloadNode(node);

  return (
    <MenuActionItem onClick={download} hidden={!node.canDownload}>
      Download
    </MenuActionItem>
  );
}

function Rename({ node }: { node: Node }) {
  const [isOpen, toggle] = useBoolState(false);

  const modal = (
    <RenameNodeModal
      node={node}
      isOpen={isOpen}
      hideModal={toggle}
      // Key is needed because when the folder's name changes, if the component
      // is not rerendered, the old name will appear in the form
      key={node.name}
    />
  );

  return (
    <MenuActionItem onClick={toggle} testId={node.renameMenuTestId} hidden={!node.canRename}>
      Rename
      {modal}
    </MenuActionItem>
  );
}

function Copy({ node }: { node: Node }) {
  return (
    <MenuLinkItem to={node.editPath} testId={node.editMenuTestId} hidden={!node.canEdit}>
      Copy
    </MenuLinkItem>
  );
}

function Move({ node }: { node: Node }) {
  const [isOpen, toggle] = useBoolState(false);

  const modal = <MoveNodeModal node={node} isOpen={isOpen} hideModal={toggle} />;

  return (
    <MenuActionItem onClick={toggle} testId={node.moveMenuTestId} hidden={!node.canMove}>
      Move
      {modal}
    </MenuActionItem>
  );
}

function Delete({ node }: { node: Node }) {
  const deleteNode = useDeleteNode(node);

  return (
    <MenuActionItem onClick={deleteNode} testId={node.deleteMenuTestId} hidden={!node.canDelete}>
      Delete
    </MenuActionItem>
  );
}

function Edit({ node }: { node: Node }) {
  return <MenuLinkItem to={node.editPath} testId={node.editMenuTestId} hidden={!node.canEdit} children="Edit" />;
}
