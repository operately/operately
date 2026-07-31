import React from "react";

import { Menu, MenuActionItem } from "../Menu";
import { IconEdit, IconTrash } from "../icons";

interface KpiActionsMenuProps {
  kpiId: string;
  onEdit: () => void;
  onDelete: () => void;

  // Optional custom trigger. Must be a raw DOM element (Radix clones it via
  // `asChild`). Defaults to the shared "dots" icon button when omitted.
  customTrigger?: React.ReactNode;
}

// Overflow menu exposing the manage actions (Edit / Delete) for a single KPI.
// Shared between the list rows and the detail header so both surfaces offer the
// same actions with identical test ids.
export function KpiActionsMenu({ kpiId, onEdit, onDelete, customTrigger }: KpiActionsMenuProps) {
  return (
    <Menu testId={`kpi-actions-${kpiId}`} customTrigger={customTrigger} size="tiny">
      <MenuActionItem icon={IconEdit} onClick={onEdit} testId={`edit-kpi-${kpiId}`}>
        Edit KPI
      </MenuActionItem>
      <MenuActionItem icon={IconTrash} onClick={onDelete} danger testId={`delete-kpi-${kpiId}`}>
        Delete KPI
      </MenuActionItem>
    </Menu>
  );
}
