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
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-content-dimmed transition hover:bg-surface-dimmed hover:text-content-base sm:min-h-0 sm:min-w-0 sm:p-1.5"
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
