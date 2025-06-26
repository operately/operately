import React, { useState } from "react";
import { SecondaryButton, PrimaryButton } from "../Button";
import { IconBrandSlack, IconBrandGithub, IconFileText, IconTable, IconCalendar, IconLink } from "../icons";

export namespace ResourceManager {
  export interface Resource {
    id: string;
    name: string;
    url: string;
    type: ResourceType;
  }

  export type ResourceType = "slack" | "github" | "google_doc" | "google_sheet" | "basecamp" | "link";

  export interface Props {
    resources?: Resource[];
    onResourceAdd?: (resource: Omit<Resource, "id">) => void;
    onResourceEdit?: (id: string, resource: Partial<Resource>) => void;
    onResourceRemove?: (id: string) => void;
    canEdit?: boolean;
  }
}

const RESOURCE_TYPES = {
  slack: {
    name: "Slack Channel",
    icon: IconBrandSlack,
    color: "text-purple-500",
  },
  github: {
    name: "Github Repository",
    icon: IconBrandGithub,
    color: "text-gray-900",
  },
  google_doc: {
    name: "Google Document",
    icon: IconFileText,
    color: "text-blue-500",
  },
  google_sheet: {
    name: "Google Sheet",
    icon: IconTable,
    color: "text-green-500",
  },
  basecamp: {
    name: "Basecamp Project",
    icon: IconCalendar,
    color: "text-yellow-500",
  },
  link: {
    name: "Link",
    icon: IconLink,
    color: "text-gray-500",
  },
} as const;

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-content-base">Resources</h3>
        {canEdit && (
          <SecondaryButton size="xxs" onClick={() => setIsAddModalOpen(true)}>
            {hasResources ? "Edit" : "Add"}
          </SecondaryButton>
        )}
      </div>

      {hasResources ? (
        <div className="space-y-2">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onEdit={onResourceEdit}
              onRemove={onResourceRemove}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-content-subtle">
          <p className="text-xs">Pin links to external resources.</p>
        </div>
      )}

      {isAddModalOpen && (
        <AddResourceModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={onResourceAdd}
          existingResources={resources}
        />
      )}
    </div>
  );
}

function ResourceCard({
  resource,
  onEdit,
  onRemove,
  canEdit,
}: {
  resource: ResourceManager.Resource;
  onEdit?: (id: string, resource: Partial<ResourceManager.Resource>) => void;
  onRemove?: (id: string) => void;
  canEdit: boolean;
}) {
  const resourceType = RESOURCE_TYPES[resource.type];
  const IconComponent = resourceType.icon;

  return (
    <div className="group flex items-center justify-between py-2 px-3 rounded-md hover:bg-surface-highlight transition-colors">
      <a 
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className={`w-6 h-6 rounded flex items-center justify-center ${resourceType.color} flex-shrink-0`}>
          <IconComponent size={14} />
        </div>
        <span className="text-sm group-hover:text-content-accent transition-colors truncate">{resource.name}</span>
      </a>
      
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button 
            onClick={() => onEdit?.(resource.id, resource)} 
            className="text-xs text-content-dimmed hover:text-content-accent transition-colors px-1"
          >
            Edit
          </button>
          <button 
            onClick={() => onRemove?.(resource.id)} 
            className="text-xs text-content-dimmed hover:text-content-error transition-colors px-1"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function AddResourceModal({
  onClose,
  onAdd,
  existingResources,
}: {
  onClose: () => void;
  onAdd?: (resource: Omit<ResourceManager.Resource, "id">) => void;
  existingResources: ResourceManager.Resource[];
}) {
  const [selectedType, setSelectedType] = useState<ResourceManager.ResourceType | null>(null);

  const handleTypeSelect = (type: ResourceManager.ResourceType) => {
    setSelectedType(type);
  };

  const handleFormSubmit = (resource: Omit<ResourceManager.Resource, "id">) => {
    onAdd?.(resource);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-base border border-surface-outline rounded-xl shadow-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Manage Resources</h2>
          <button 
            onClick={onClose} 
            className="text-content-dimmed hover:text-content-base p-1 hover:bg-surface-highlight rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          </button>
        </div>

        {selectedType ? (
          <AddResourceForm type={selectedType} onSubmit={handleFormSubmit} onCancel={() => setSelectedType(null)} />
        ) : (
          <>
            {existingResources.length > 0 && (
              <div className="mb-8 pb-6 border-b border-surface-outline">
                <h3 className="font-medium mb-4 text-content-base">Current Resources</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {existingResources.map((resource) => {
                    const resourceType = RESOURCE_TYPES[resource.type];
                    const IconComponent = resourceType.icon;

                    return (
                      <div key={resource.id} className="bg-surface-highlight border border-surface-outline rounded-lg p-3 group">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-surface-base flex items-center justify-center ${resourceType.color} flex-shrink-0`}>
                            <IconComponent size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-xs truncate">{resource.name}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-content-dimmed mt-0.5">
                              <button className="hover:text-content-accent transition-colors">Edit</button>
                              <span>•</span>
                              <button className="hover:text-content-error transition-colors">Remove</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-6 text-center text-content-subtle text-sm uppercase tracking-wide">Add a New Resource</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(RESOURCE_TYPES).map(([type, config]) => {
                  const IconComponent = config.icon;

                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeSelect(type as ResourceManager.ResourceType)}
                      className="bg-surface-dimmed border border-surface-outline rounded-lg p-4 hover:bg-surface-highlight hover:border-surface-accent transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-center mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-surface-base flex items-center justify-center ${config.color} group-hover:scale-110 transition-transform duration-200`}>
                          <IconComponent size={20} />
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-sm mb-1 group-hover:text-content-accent transition-colors">{config.name}</h4>
                        <span className="text-xs text-content-accent opacity-0 group-hover:opacity-100 transition-opacity">Click to add</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AddResourceForm({
  type,
  onSubmit,
  onCancel,
}: {
  type: ResourceManager.ResourceType;
  onSubmit: (resource: Omit<ResourceManager.Resource, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const resourceType = RESOURCE_TYPES[type];
  const IconComponent = resourceType.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && url.trim()) {
      onSubmit({
        name: name.trim(),
        url: url.trim(),
        type,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-surface-outline">
        <div
          className={`w-14 h-14 rounded-xl bg-surface-dimmed flex items-center justify-center ${resourceType.color}`}
        >
          <IconComponent size={28} />
        </div>
        <div>
          <h3 className="text-xl font-bold">Adding a {resourceType.name}</h3>
          <p className="text-sm text-content-subtle">Fill in the details below to add this resource</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-content-base">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={resourceType.name}
            className="w-full px-3 py-2.5 bg-surface-base border border-surface-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-base focus:border-accent-base transition-colors"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-content-base">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 bg-surface-base border border-surface-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-base focus:border-accent-base transition-colors"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <PrimaryButton type="submit" size="sm">
          Save
        </PrimaryButton>
        <SecondaryButton type="button" size="sm" onClick={onCancel}>
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
