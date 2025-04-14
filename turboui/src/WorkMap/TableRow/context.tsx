import React, { createContext, useContext, useState } from 'react';
import { WorkMapItem } from '../types';
import { useItemStatus } from './hooks/useItemStatus';

interface TableRowContextValue {
  // Item data
  item: WorkMapItem;
  
  // Status flags
  isCompleted: boolean;
  isPending: boolean;
  isFailed: boolean;
  isDropped: boolean;
  
  // UI state
  isSelected: boolean;
  filter?: string;
  showAddButton: boolean;
  setShowAddButton: React.Dispatch<React.SetStateAction<boolean>>;
  showQuickEntryWidget: boolean;
  setShowQuickEntryWidget: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Expansion state
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  hasChildren: boolean;
  
  // Layout
  level: number;
  showIndentation: boolean;
  indentPadding: number;
  
  // Event handlers
  handleDeleteClick: (e: React.MouseEvent) => void;
  handleRowClick: (e: React.MouseEvent<HTMLTableRowElement>) => void;
  
  // Navigation
  selectedItemId?: string;
  onRowClick?: (item: WorkMapItem) => void;
  
  // Page context
  isCompletedPage: boolean;
  isLastItem: boolean;
}

const TableRowContext = createContext<TableRowContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  item: WorkMapItem;
  level: number;
  isLast?: boolean;
  filter?: string;
  isSelected?: boolean;
  selectedItemId?: string;
  onRowClick?: (item: WorkMapItem) => void;
}

export function TableRowProvider({
  children,
  item,
  level,
  isLast,
  filter,
  isSelected,
  selectedItemId,
  onRowClick
}: ProviderProps) {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [showAddButton, setShowAddButton] = useState<boolean>(false);
  const [showQuickEntryWidget, setShowQuickEntryWidget] = useState<boolean>(false);

  // Get status flags from the hook
  const { isCompleted, isPending, isFailed, isDropped } = useItemStatus(item.status);
  
  // Derived properties
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const showIndentation = !filter || filter === "goals" || filter === "all";
  const indentPadding = showIndentation ? level * 20 : 0;
  const isCompletedPage = filter === "completed";
  
  // Selection state
  const isThisItemSelected = isSelected || (selectedItemId && selectedItemId === item.id);
  
  // Event handlers
  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>): void => {
    // Prevent click from bubbling when clicking links or buttons
    const target = e.target as HTMLElement;
    if (
      target.tagName.toLowerCase() === "a" ||
      target.tagName.toLowerCase() === "button" ||
      target.closest("a") ||
      target.closest("button")
    ) {
      return;
    }

    // Call the selection handler
    if (onRowClick) {
      onRowClick(item);
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    
    const event = new CustomEvent("workmap:delete-item", {
      detail: { itemId: item.id },
    });
    document.dispatchEvent(event);
  };

  const contextValue: TableRowContextValue = {
    item,
    isCompleted,
    isPending,
    isFailed,
    isDropped,
    isSelected: Boolean(isThisItemSelected),
    filter,
    showAddButton,
    setShowAddButton,
    showQuickEntryWidget,
    setShowQuickEntryWidget,
    expanded,
    setExpanded,
    hasChildren,
    level,
    showIndentation,
    indentPadding,
    handleDeleteClick,
    handleRowClick,
    selectedItemId,
    onRowClick,
    isCompletedPage,
    isLastItem: Boolean(isLast)
  };

  return (
    <TableRowContext.Provider value={contextValue}>
      {children}
    </TableRowContext.Provider>
  );
}

export function useTableRowContext() {
  const context = useContext(TableRowContext);
  
  if (context === undefined) {
    throw new Error('useTableRowContext must be used within a TableRowProvider');
  }
  
  return context;
}
