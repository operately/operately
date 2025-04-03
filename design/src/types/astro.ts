/**
 * Type definitions for Astro components
 */

/**
 * Layout props
 */
export interface LayoutProps {
  title?: string;
}

export interface FullWidthLayoutProps extends LayoutProps {
  showBreadcrumbs?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
  transitionBackground?: boolean; // Enables transitional background from brand to neutral
}

export interface StandardLayoutProps extends LayoutProps {
  showBreadcrumbs?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
}

/**
 * Navigation component props
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface NavigationBarProps {
  activeItem?: string;
}

/**
 * Theme toggle props
 */
export interface ThemeToggleProps {
  initialTheme?: 'light' | 'dark' | 'system';
}
