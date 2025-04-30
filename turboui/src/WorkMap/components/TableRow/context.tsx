import React, { createContext, useContext, useState } from "react";
import { WorkMap } from "..";
import { useItemStatus } from "../../hooks/useItemStatus";
import { useQuickEntryWidgetState } from "../../hooks/useQuickEntryWidgetState";

interface TableRowContextValue {
  // Item data
  item: WorkMap.Item;

  // Status flags
  isCompleted: boolean;
  isPending: boolean;
  isFailed: boolean;
  isDropped: boolean;

  // UI state
  isSelected: boolean;
  filter: WorkMap.Filter;
  showAddButton: boolean;
  setShowAddButton: (show: boolean) => void;
  showQuickEntryWidget: boolean;
  setShowQuickEntryWidget: (show: boolean) => void;

  // Expansion state
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  hasChildren: boolean;

  // Layout
  level: number;
  showIndentation: boolean;
  indentPadding: number;

  // Event handlers
  handleRowClick: (e: React.MouseEvent<HTMLTableRowElement>) => void;

  // Navigation
  selectedItemId?: string;
  onRowClick?: (item: WorkMap.Item) => void;

  // Page context
  isCompletedPage: boolean;
  isLastItem: boolean;
}

const TableRowContext = createContext<TableRowContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  item: WorkMap.Item;
  level: number;
  isLast?: boolean;
  filter: WorkMap.Filter;
  isSelected?: boolean;
  selectedItemId?: string;
  onRowClick?: (item: WorkMap.Item) => void;
}

export function TableRowProvider({
  children,
  item,
  level,
  isLast,
  filter,
  isSelected,
  selectedItemId,
  onRowClick,
}: ProviderProps) {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [showAddButton, setShowAddButton] = useState<boolean>(false);

  // Use our shared hook for managing QuickEntryWidget visibility
  const {
    isWidgetOpen: showQuickEntryWidget,
    setWidgetOpen: setShowQuickEntryWidget,
    anyWidgetOpen,
  } = useQuickEntryWidgetState(false);

  // Custom add button management that checks if any widget is open
  const handleSetShowAddButton = (show: boolean) => {
    // Don't show add buttons if any widget is open
    if (show && anyWidgetOpen) return;
    setShowAddButton(show);
  };

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

  const contextValue: TableRowContextValue = {
    item,
    isCompleted,
    isPending,
    isFailed,
    isDropped,
    isSelected: Boolean(isThisItemSelected),
    filter,
    showAddButton,
    setShowAddButton: handleSetShowAddButton,
    showQuickEntryWidget,
    setShowQuickEntryWidget,
    expanded,
    setExpanded,
    hasChildren,
    level,
    showIndentation,
    indentPadding,
    handleRowClick,
    selectedItemId,
    onRowClick,
    isCompletedPage,
    isLastItem: Boolean(isLast),
  };

  return <TableRowContext.Provider value={contextValue}>{children}</TableRowContext.Provider>;
}

export function useTableRowContext() {
  const context = useContext(TableRowContext);

  if (context === undefined) {
    throw new Error("useTableRowContext must be used within a TableRowProvider");
  }

  return context;
}
