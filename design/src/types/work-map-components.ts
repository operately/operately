/**
 * Type definitions for WorkMap components used in Astro pages
 */
import type { WorkMapItem } from './workmap';

/**
 * Props for the WorkMapTable component
 */
export interface WorkMapTableProps {
  filter: 'all' | 'goals' | 'projects' | 'completed';
  selectedItemId?: string;
  onRowClick?: (item: WorkMapItem) => void;
}

/**
 * Props for the WorkMapTabs component
 */
export interface WorkMapTabsProps {
  activeTab: 'all' | 'goals' | 'projects' | 'completed';
}

/**
 * Props for the TableRow component
 */
export interface TableRowProps {
  item: WorkMapItem;
  level: number;
  isLast: boolean;
  filter: string;
  isSelected: boolean;
  onRowClick?: (item: WorkMapItem) => void;
  selectedItemId?: string;
}

/**
 * Props for the QuickAddRow component
 */
export interface QuickAddRowProps {
  parentItem?: WorkMapItem;
  onAddItem: (item: WorkMapItem, parentItem?: WorkMapItem) => void;
  filterType: 'all' | 'goals' | 'projects';
}

/**
 * Props for the HoverQuickEntryWidget component
 */
export interface HoverQuickEntryWidgetProps {
  parentItem?: WorkMapItem;
  onAddItem: (item: WorkMapItem, parentItem?: WorkMapItem) => void;
  autoFocus?: boolean;
}

/**
 * Props for the SelectableTableRow component
 */
export interface SelectableTableRowProps {
  item: WorkMapItem;
  isSelected: boolean;
  onSelect: (item: WorkMapItem) => void;
}
