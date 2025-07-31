import * as React from "react";

import { GoalPage } from ".";
import { Checklist } from "../Checklist";

export function Checklists(props: GoalPage.Props) {
  // Don't render if checklists feature is not enabled
  if (!props.checklistsEnabled) {
    return null;
  }

  return (
    <Checklist
      items={props.checklistItems}
      canEdit={props.canEdit}
      addItem={props.addChecklistItem}
      deleteItem={props.deleteChecklistItem}
      updateItem={props.updateChecklistItem}
      toggleItem={props.toggleChecklistItem}
      updateItemIndex={props.updateChecklistItemIndex}
    />
  );
}