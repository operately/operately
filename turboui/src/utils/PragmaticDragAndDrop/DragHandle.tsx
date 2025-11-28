import React from "react";
import classNames from "../classnames";
import { IconGripVertical } from "../../icons";

interface DragHandleProps {
  isDragging: boolean;
  disabled?: boolean;
  className?: string;
  size?: number;
}

/**
 * Reusable drag handle component with consistent styling.
 * 
 * Shows a grip icon that appears on hover and provides visual feedback during dragging.
 * Use this with the dragHandleRef from useSortableItem.
 * 
 * @param isDragging - Whether the item is currently being dragged
 * @param disabled - Whether dragging is disabled
 * @param className - Additional CSS classes to apply
 * 
 * @example
 * const { dragHandleRef, isDragging } = useSortableItem({ itemId, index });
 * 
 * return (
 *   <div ref={dragHandleRef}>
 *     <DragHandle isDragging={isDragging} />
 *   </div>
 * );
 */
export function DragHandle({ isDragging, disabled = false, className, size = 16 }: DragHandleProps) {
  const dragGripClass = classNames(
    "text-content-subtle opacity-0 group-hover:opacity-100 transition-all",
    {
      "cursor-grab": !isDragging && !disabled,
      "cursor-grabbing": isDragging && !disabled,
      "opacity-100": isDragging && !disabled,
      hidden: disabled,
    },
    className,
  );

  return <IconGripVertical size={size} className={dragGripClass} />;
}
