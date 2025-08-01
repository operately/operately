import * as React from "react";

import { GoalPage } from ".";
import { Checklist } from "../Checklist";

const noOpAsync = async () => ({ success: false, id: "" });
const noOpAsyncBoolean = async () => false;

export function Checklists(props: GoalPage.Props) {
  // Don't render if checklists feature is not enabled or items are not provided
  if (!props.checklistsEnabled || !props.checklistItems) {
    return null;
  }

  return (
    <Checklist
      items={props.checklistItems}
      canEdit={props.canEdit}
      addItem={props.addChecklistItem || noOpAsync}
      deleteItem={props.deleteChecklistItem || noOpAsyncBoolean}
      updateItem={props.updateChecklistItem || noOpAsyncBoolean}
      toggleItem={props.toggleChecklistItem || noOpAsyncBoolean}
      updateItemIndex={props.updateChecklistItemIndex || noOpAsyncBoolean}
    />
  );
}