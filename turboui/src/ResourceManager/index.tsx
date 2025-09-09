import React, { useState } from "react";
import { SecondaryButton, PrimaryButton } from "../Button";
import { IconLink } from "../icons";
import { SectionHeader } from "../TaskPage/SectionHeader";
import { ResourceLink } from "../ResourceLink";
import { Textfield } from "../forms/Textfield";
import Modal from "../Modal";

export namespace ResourceManager {
  export interface NewResourcePayload extends Omit<Resource, "id"> {}

  export interface Resource {
    id: string;
    name: string;
    url: string;
    type?: string; // Optional for backward compatibility
  }

  export interface Props {
    resources: Resource[];
    onResourceAdd: (resource: NewResourcePayload) => void;
    onResourceEdit: (resource: Resource) => void;
    onResourceRemove: (id: string) => void;
    canEdit?: boolean;
  }
}

export function ResourceManager({
  resources = [],
  onResourceAdd,
  onResourceEdit,
  onResourceRemove,
  canEdit = true,
}: ResourceManager.Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const hasResources = resources.length > 0;

  if (!hasResources && !canEdit) {
    return null;
  }

  const addButton = (
    <SecondaryButton size="xxs" onClick={() => setIsAddModalOpen(true)}>
      Add resource
    </SecondaryButton>
  );

  return (
    <div className="space-y-4">
      {/* Header with inline add button */}
      <div className="flex items-center gap-2">
        <SectionHeader title="Resources" />
        {canEdit && addButton}
      </div>

      {/* Resources content */}
      {hasResources ? (
        <div className="flex flex-wrap gap-2">
          {resources.map((resource) => (
            <ResourceLink
              key={resource.id}
              resource={resource}
              onEdit={onResourceEdit}
              onRemove={onResourceRemove}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : null}

      <AddResourceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={onResourceAdd} />
    </div>
  );
}

function AddResourceModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (resource: ResourceManager.NewResourcePayload) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tmpErrors: string[] = [];

    if (!url.trim()) {
      tmpErrors.push("url");
    }
    if (!name.trim()) {
      tmpErrors.push("name");
    }

    if (tmpErrors.length > 0) {
      setError(tmpErrors);
      return;
    }

    onAdd?.({
      name: name.trim(),
      url: url.trim(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} contentPadding="">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <IconLink size={20} className="text-content-base" />
          <h2 className="text-xl font-bold">Add link to a resource</h2>
        </div>

        <div className="space-y-4">
          <Textfield
            id="resource-url"
            type="url"
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            autoFocus
            error={error.includes("url") ? "URL is required" : undefined}
          />
          <Textfield
            id="resource-title"
            label="Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Resource title"
            type="text"
            inputClassName="px-3 py-2.5 bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-base focus:border-accent-base transition-colors"
            error={error.includes("name") ? "Title is required" : undefined}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit">Save</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
