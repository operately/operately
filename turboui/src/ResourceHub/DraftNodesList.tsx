import * as React from "react";

import { ErrorCallout } from "../Callouts";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { Menu, MenuActionItem } from "../Menu";
import { DeleteResourceConfirmModal } from "./DeleteResourceConfirmModal";
import { ResourceHubNodeRow } from "./ResourceHubNodeRow";
import { getNodeId, getNodeName } from "./selectors";
import type { ResourceHubNode } from "./types";

export interface DraftNodesListProps {
  nodes: ResourceHubNode[];
  getNodePath: (node: ResourceHubNode) => string;
  formattedTimePreferences: FormattedTimePreferences;
  onDelete?: (documentId: string) => Promise<void>;
}

export function DraftNodesList({ nodes, getNodePath, formattedTimePreferences, onDelete }: DraftNodesListProps) {
  return (
    <div className="md:m-6">
      {nodes.map((node, index) => (
        <ResourceHubNodeRow
          key={getNodeId(node) ?? index}
          node={node}
          path={getNodePath(node)}
          testId={`node-${index}`}
          className="first:border-t-0"
          description={<DraftDescription node={node} preferences={formattedTimePreferences} />}
          actions={onDelete && node.document?.id && <DeleteDraft node={node} onDelete={onDelete} />}
        />
      ))}
    </div>
  );
}

function DraftDescription({ node, preferences }: { node: ResourceHubNode; preferences: FormattedTimePreferences }) {
  const path = ["Docs & Files", ...(node.pathToNode ?? []).map((folder) => folder.name)].join(" / ");
  const savedAt = node.document?.updatedAt;

  return (
    <div className="text-sm text-content-dimmed">
      <div data-test-id="draft-location">{path}</div>
      {savedAt && (
        <div>
          Last saved <FormattedTime time={savedAt} format="relative-time-or-date" {...preferences} />
        </div>
      )}
    </div>
  );
}

function DeleteDraft({ node, onDelete }: { node: ResourceHubNode; onDelete: (id: string) => Promise<void> }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const documentId = node.document?.id;
  if (!documentId) return null;

  const handleDelete = async () => {
    setFailed(false);
    try {
      await onDelete(documentId);
      setIsOpen(false);
    } catch {
      setFailed(true);
      setIsOpen(false);
    }
  };

  return (
    <div>
      {failed && <ErrorCallout testId="draft-delete-error" message="Couldn't delete the draft. Please try again." />}
      <Menu size="medium" testId={`draft-menu-${documentId}`}>
        <MenuActionItem danger onClick={() => setIsOpen(true)} testId={`delete-draft-${documentId}`}>
          Delete draft
        </MenuActionItem>
      </Menu>
      <DeleteResourceConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        resourceType="draft"
        resourceName={getNodeName(node)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
