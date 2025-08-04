import React, { useState } from "react";
import { SecondaryButton, PrimaryButton } from "../Button";
import { IconLink } from "../icons";
import { SectionHeader } from "../TaskPage/SectionHeader";
import { ResourceLink } from "../ResourceLink";

export namespace ResourceManager {
  export interface Resource {
    id: string;
    name: string;
    url: string;
    type?: string; // Optional for backward compatibility
  }

  export interface Props {
    resources?: Resource[];
    onResourceAdd?: (resource: Omit<Resource, "id">) => void;
    onResourceEdit?: (id: string, resource: Partial<Resource>) => void;
    onResourceRemove?: (id: string) => void;
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

      {isAddModalOpen && <AddResourceModal onClose={() => setIsAddModalOpen(false)} onAdd={onResourceAdd} />}
    </div>
  );
}

function AddResourceModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd?: (resource: Omit<ResourceManager.Resource, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd?.({
        name: name.trim(),
        url: url.trim(),
      });
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onKeyDown={handleKeyDown}>
      <div className="bg-surface-base border border-surface-outline rounded-xl shadow-xl max-w-lg w-full">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconLink size={20} className="text-content-base" />
              <h2 className="text-xl font-bold">Add link to a resource</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-content-dimmed hover:text-content-base p-1 hover:bg-surface-highlight rounded transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-content-base">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 bg-surface-base border border-surface-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-base focus:border-accent-base transition-colors"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-content-base">
                Title <span className="text-content-subtle font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Resource title"
                className="w-full px-3 py-2.5 bg-surface-base border border-surface-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-base focus:border-accent-base transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!url.trim()}>
              Save
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
