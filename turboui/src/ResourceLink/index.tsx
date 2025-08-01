import React, { useState, useRef, useEffect } from "react";
import { IconLink, IconExternalLink, IconDots, IconCopy, IconPencil, IconTrash } from "../icons";
import { ResourceManager } from "../ResourceManager";
import { PrimaryButton, SecondaryButton } from "../Button";
import { showInfoToast } from "../Toasts";
import { ConfirmDialog } from "../ConfirmDialog";

export interface ResourceLinkProps {
  resource: ResourceManager.Resource;
  onEdit?: (id: string, resource: Partial<ResourceManager.Resource>) => void;
  onRemove?: (id: string) => void;
  canEdit?: boolean;
}

export function ResourceLink({ resource, onEdit, onRemove, canEdit }: ResourceLinkProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'right' | 'left'>('right');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }

    return undefined;
  }, [showMenu]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resource.url);
      showInfoToast("Link copied", "The URL has been copied to your clipboard");
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleMenuToggle = () => {
    if (!showMenu && containerRef.current) {
      // Calculate if menu would go off-screen based on component position
      const containerRect = containerRef.current.getBoundingClientRect();
      const menuWidth = 140; // min-w-[140px] from the menu
      const spaceOnLeft = containerRect.left;
      
      // If there's not enough space on the left, align menu with left edge of component
      // Otherwise, align with right edge (normal behavior)
      if (spaceOnLeft < menuWidth) {
        setMenuPosition('left'); // left edge of menu aligns with left edge of component
      } else {
        setMenuPosition('right'); // right edge of menu aligns with right edge of component
      }
    }
    setShowMenu(!showMenu);
  };

  const handleEdit = () => {
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleRemove = () => {
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const confirmRemove = () => {
    onRemove?.(resource.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <div className="flex items-center hover:bg-surface-highlight border border-stroke-base rounded-md transition-colors group text-content-base">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 min-w-0"
        >
          <IconLink size={14} className="text-link-base flex-shrink-0" />
          <span className="text-sm text-link-base font-medium truncate max-w-[200px]">
            {resource.name.trim() || resource.url}
          </span>
        </a>

        {canEdit ? (
          <>
            {/* On hover, external link icon transforms into separator + dots */}
            <div className="flex items-center">
              <IconExternalLink
                size={12}
                className="flex-shrink-0 text-link-base mr-3 group-hover:opacity-0 transition-opacity"
              />
              <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                <div className="w-px h-4 bg-stroke-base ml-3 mr-0"></div>
                <button
                  ref={buttonRef}
                  onClick={handleMenuToggle}
                  className="p-2 text-content-base hover:text-content-base transition-colors"
                >
                  <IconDots size={14} />
                </button>
              </div>
            </div>

            {showMenu && (
              <div
                ref={menuRef}
                className={`absolute top-full mt-1 bg-surface-base border border-stroke-base rounded-lg shadow-lg py-1 z-10 min-w-[140px] ${
                  menuPosition === 'left' ? 'left-0' : 'right-0'
                }`}
              >
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-content-base hover:bg-surface-highlight transition-colors"
                >
                  <IconCopy size={14} />
                  Copy link
                </button>
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-content-base hover:bg-surface-highlight transition-colors"
                >
                  <IconPencil size={14} />
                  Edit
                </button>
                <button
                  onClick={handleRemove}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-content-error hover:bg-surface-highlight transition-colors"
                >
                  <IconTrash size={14} />
                  Delete
                </button>
              </div>
            )}
          </>
        ) : (
          /* When not editable, just show the external link icon */
          <IconExternalLink size={12} className="flex-shrink-0 text-link-base mr-2" />
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditResourceModal
          resource={resource}
          onSave={(updatedResource) => {
            onEdit?.(resource.id, updatedResource);
            setShowEditModal(false);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={confirmRemove}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete resource"
        message={`Are you sure you want to delete "${resource.name.trim() || resource.url}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={IconTrash}
      />
    </div>
  );
}

function EditResourceModal({
  resource,
  onSave,
  onCancel,
}: {
  resource: ResourceManager.Resource;
  onSave: (resource: Partial<ResourceManager.Resource>) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(resource.url);
  const [name, setName] = useState(resource.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSave({
        url: url.trim(),
        name: name.trim(),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-base border border-stroke-base rounded-xl shadow-xl max-w-lg w-full">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <IconLink size={20} className="text-content-base" />
            <h2 className="text-xl font-semibold text-content-base">Edit project link</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-base mb-2">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-base border border-stroke-base rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-base focus:border-accent-base transition-colors"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-base mb-2">
                Title <span className="text-content-subtle font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={resource.name}
                className="w-full px-3 py-2.5 bg-surface-base border border-stroke-base rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-base focus:border-accent-base transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <SecondaryButton type="button" onClick={onCancel}>
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

