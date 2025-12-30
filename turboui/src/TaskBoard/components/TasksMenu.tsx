import React, { useCallback, useEffect, useState } from "react";
import { IconSettings } from "../../icons";
import { Menu, MenuActionItem } from "../../Menu";
import { StatusCustomizationModal } from "../../StatusCustomization";
import { StatusSelector } from "../../StatusSelector";

interface Props {
  canManageStatuses: boolean;
  statuses: StatusSelector.StatusOption[];
  onSaveCustomStatuses: (data: {
    nextStatuses: StatusSelector.StatusOption[];
    deletedStatusReplacements: Record<string, string>;
  }) => void;
}

export function TasksMenu({ canManageStatuses, statuses, onSaveCustomStatuses }: Props) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalStatuses, setStatusModalStatuses] = useState<StatusSelector.StatusOption[]>(statuses);

  useEffect(() => {
    setStatusModalStatuses(statuses);
  }, [statuses]);

  const openStatusModal = useCallback(() => setIsStatusModalOpen(true), []);
  const closeStatusModal = useCallback(() => setIsStatusModalOpen(false), []);

  const handleSaveStatuses = useCallback(
    (data: { nextStatuses: StatusSelector.StatusOption[]; deletedStatusReplacements: Record<string, string> }) => {
      setStatusModalStatuses(data.nextStatuses);
      setIsStatusModalOpen(false);
      onSaveCustomStatuses(data);
    },
    [onSaveCustomStatuses],
  );

  return (
    <>
      {canManageStatuses && (
        <Menu
          customTrigger={
            <button
              className="p-1.5 text-content-dimmed hover:text-content-base hover:bg-surface-dimmed rounded-full transition"
              aria-label="Settings"
            >
              <IconSettings size={20} />
            </button>
          }
          size="small"
          align="end"
        >
          <MenuActionItem icon={IconSettings} onClick={openStatusModal}>
            Manage statuses
          </MenuActionItem>
        </Menu>
      )}

      {canManageStatuses && (
        <StatusCustomizationModal
          isOpen={isStatusModalOpen}
          onClose={closeStatusModal}
          statuses={statusModalStatuses}
          onSave={handleSaveStatuses}
          requireReplacement
        />
      )}
    </>
  );
}
