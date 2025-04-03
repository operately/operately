import React from "react";
import { TableRow } from "./TableRow";
import type { WorkMapItem } from "../../types/workmap";

interface SelectableTableRowProps {
  /**
   * The work map item (goal or project) to display
   */
  item: WorkMapItem;
  
  /**
   * The nesting level of this item in the hierarchy
   */
  level: number;
  
  /**
   * Whether this is the last item in its parent's children list
   */
  isLast: boolean;
  
  /**
   * The current filter applied to the work map table
   * (e.g., "all", "goals", "projects", "completed")
   */
  filter?: string;
  
  /**
   * Callback function when an item is selected
   */
  onSelectItem: (item: WorkMapItem) => void;
  
  /**
   * ID of the currently selected item
   */
  selectedItemId?: string;
}

/**
 * Enhanced Table Row component that supports selection and recursively renders children
 */
export function SelectableTableRow({ 
  item, 
  level, 
  isLast, 
  filter, 
  onSelectItem, 
  selectedItemId 
}: SelectableTableRowProps): React.ReactElement {
  const isSelected = selectedItemId === item.id;
  
  // Handle click on the row to select it
  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Prevent default to avoid navigating if this is a link
    e.preventDefault();
    
    // Don't trigger if clicking on a link or button inside the row
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'a' || 
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') || 
        target.closest('button')) {
      return;
    }
    
    // Call the selection handler with the item data
    onSelectItem(item);
  };
  
  return (
    <div 
      className={`cursor-pointer transition-colors ${isSelected ? 'bg-surface-highlight dark:bg-surface-dimmed/30' : ''}`}
      onClick={handleRowClick}
    >
      <TableRow 
        item={item} 
        level={level} 
        isLast={isLast} 
        filter={filter}
        isSelected={isSelected}
        onRowClick={onSelectItem}
        selectedItemId={selectedItemId}
      />
      
      {/* If the item has children, render them recursively */}
      {item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child: WorkMapItem, index: number) => (
            <SelectableTableRow
              key={child.id}
              item={child}
              level={level + 1}
              isLast={index === item.children.length - 1}
              filter={filter}
              onSelectItem={onSelectItem}
              selectedItemId={selectedItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
