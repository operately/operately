/**
 * Types for general UI components
 */
import type { BaseComponentProps, WithChildren, Size, ThemeColor } from './common';

/**
 * Avatar component props
 */
export interface AvatarProps extends BaseComponentProps {
  /**
   * URL to the avatar image
   */
  src?: string;
  
  /**
   * Alt text for the avatar
   */
  alt?: string;
  
  /**
   * Fallback text/initials when no image is available
   */
  fallback?: string;
  
  /**
   * Size of the avatar
   */
  size?: Size | number;
  
  /**
   * Shape of the avatar
   */
  shape?: 'circle' | 'square';
  
  /**
   * Whether to show a status indicator
   */
  status?: 'online' | 'offline' | 'away' | 'busy' | null;
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps, WithChildren {
  /**
   * Card title
   */
  title?: string | React.ReactNode;
  
  /**
   * Card subtitle
   */
  subtitle?: string | React.ReactNode;
  
  /**
   * Whether to render a border
   */
  bordered?: boolean;
  
  /**
   * Whether to add a hover effect
   */
  hoverable?: boolean;
  
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
  
  /**
   * Optional header actions (e.g. menu, close button)
   */
  actions?: React.ReactNode;
}

/**
 * Alert/Notification component props
 */
export interface AlertProps extends BaseComponentProps, WithChildren {
  /**
   * Alert variant/type
   */
  variant?: 'info' | 'success' | 'warning' | 'error';
  
  /**
   * Alert title
   */
  title?: string | React.ReactNode;
  
  /**
   * Whether the alert is dismissible
   */
  dismissible?: boolean;
  
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
}

/**
 * Badge component props
 */
export interface BadgeProps extends BaseComponentProps, WithChildren {
  /**
   * Badge content/count
   */
  count?: number | string;
  
  /**
   * Maximum count to display before showing "+"
   */
  maxCount?: number;
  
  /**
   * Badge color
   */
  color?: ThemeColor;
  
  /**
   * Whether to show a dot instead of count
   */
  dot?: boolean;
  
  /**
   * Badge size
   */
  size?: 'sm' | 'md' | 'lg';
}
