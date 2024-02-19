import React from "react";
import { useDragAndDropContext } from "./context";

export function DndDebug() {
  const context = useDragAndDropContext();

  return (
    <div className="mt-4">
      <pre>{JSON.stringify(context.overDropZoneId, null, 2)}</pre>
    </div>
  );
}
