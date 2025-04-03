/**
 * Types related to form components and functionality
 */
import type { BaseComponentProps, WithChildren } from './common';

/**
 * Base input props
 */
export interface BaseInputProps extends BaseComponentProps {
  /**
   * Input name
   */
  name: string;
  
  /**
   * Input label
   */
  label?: string;
  
  /**
   * Input placeholder
   */
  placeholder?: string;
  
  /**
   * Input value
   */
  value?: string | number;
  
  /**
   * Default input value
   */
  defaultValue?: string | number;
  
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the input is required
   */
  required?: boolean;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Help text
   */
  helpText?: string;
  
  /**
   * Change handler
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Dropdown/Select option
 */
export interface SelectOption {
  /**
   * Option value
   */
  value: string;
  
  /**
   * Option label
   */
  label: string;
  
  /**
   * Option disabled state
   */
  disabled?: boolean;
}

/**
 * Select props
 */
export interface SelectProps extends Omit<BaseInputProps, 'onChange'> {
  /**
   * Select options
   */
  options: SelectOption[];
  
  /**
   * Change handler
   */
  onChange?: (value: string) => void;
  
  /**
   * Whether multiple selection is allowed
   */
  multiple?: boolean;
}
