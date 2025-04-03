/**
 * Common types used throughout the application
 */

/**
 * Utility type for defining React component props with optional children
 */
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Utility type for defining components with children
 */
export interface WithChildren {
  children?: React.ReactNode;
}

/**
 * Utility type for component with ID
 */
export interface WithId {
  id: string;
}

/**
 * Common size options used throughout the UI
 */
export type Size = 'xxs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

/**
 * Common color theme options
 */
export type ThemeColor = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'neutral';
