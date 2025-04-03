/**
 * Types specific to Button components
 */
import type { BaseComponentProps, Size, WithChildren } from './common';

/**
 * Base button props interface
 * Matches the JSDoc in calcClassNames.jsx
 */
export interface BaseButtonProps extends BaseComponentProps, WithChildren {
  /**
   * Size of the button
   */
  size?: Size;
  
  /**
   * Whether the button is in loading state
   */
  loading?: boolean;
  
  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Type of the button HTML element
   */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Theme options for button rendering
 */
export interface ButtonThemeOptions {
  /**
   * Classes to apply in normal state
   */
  normal: string;
  
  /**
   * Classes to apply in loading state
   */
  loading: string;
  
  /**
   * Classes to always apply
   */
  always: string;
}

/**
 * Style variants for buttons
 */
export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';
