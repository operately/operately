import React from "react";

interface IconProps {
  size?: number;
}

export function IconTargetArrow({ size = 24 }: IconProps): React.ReactElement {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="tabler-icon tabler-icon-target-arrow"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <path d="M20 12h-4" />
      <path d="M4 12h4" />
      <path d="M12 4v4" />
      <path d="M12 16v4" />
    </svg>
  );
}

export function IconChecklist({ size = 24 }: IconProps): React.ReactElement {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="tabler-icon tabler-icon-checklist"
    >
      <path d="M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8" />
      <path d="M14 19l2 2l4 -4" />
      <path d="M9 8h4" />
      <path d="M9 12h2" />
    </svg>
  );
}

export function IconChevronDown({ size = 24 }: IconProps): React.ReactElement {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="tabler-icon tabler-icon-chevron-down"
    >
      <path d="M6 9l6 6l6 -6" />
    </svg>
  );
}

export function IconChevronRight({ size = 24 }: IconProps): React.ReactElement {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="tabler-icon tabler-icon-chevron-right"
    >
      <path d="M9 6l6 6l-6 6" />
    </svg>
  );
}
