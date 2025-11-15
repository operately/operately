import React from "react";
import { DropIndicator as AtlaskitDropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";

interface DropIndicatorProps {
  edge: Edge;
}

/**
 * Visual indicator showing where an item will be dropped during drag operations.
 * 
 * Renders a blue line at the top or bottom edge of a drop target to indicate
 * the drop position. This component wraps the Atlaskit DropIndicator with
 * a simpler interface.
 * 
 * @param edge - Which edge to show the indicator on ("top" or "bottom")
 * 
 * @example
 * const { closestEdge } = useSortableItem({ itemId: item.id, index: item.index });
 * 
 * return (
 *   <div>
 *     {closestEdge && <DropIndicator edge={closestEdge} />}
 *     <div>Item content</div>
 *   </div>
 * );
 */
export function DropIndicator({ edge }: DropIndicatorProps) {
  return <AtlaskitDropIndicator edge={edge} />;
}
