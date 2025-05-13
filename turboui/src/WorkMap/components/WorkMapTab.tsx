import React from "react";
import { DivLink } from "../../Link";
import classNames from "../../utils/classnames";
import { TestableElement } from "../../TestableElement";
import WorkMap from ".";

interface Props extends TestableElement {
  label: string;
  tab: WorkMap.Filter;
  isActive: boolean;
  icon?: React.ReactNode;
  hide?: boolean;
  setTab: (tab: WorkMap.Filter) => void;
}

/**
 * Navigation tab for WorkMap that renders differently based on environment:
 * - In standard app: Uses DivLink for URL-based navigation with tab parameters
 * - In Storybook: Uses div with onClick handler for state-based navigation
 */
export function WorkMapTab({ label, tab, isActive, icon, hide, testId, setTab }: Props) {
  const url = getTabUrl(tab);
  const className = classNames(
    "border-b-2 px-1 pt-2.5 pb-1 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer",
    isActive
      ? "border-blue-500 text-content-base"
      : "border-transparent text-content-dimmed hover:text-content-base hover:border-surface-accent",
  );

  if (hide) return null;

  if (isStorybook()) {
    return (
      <div onClick={() => setTab(tab)} className={className} data-testid={testId}>
        {icon && <span className="h-4 w-4 hidden sm:inline">{icon}</span>}
        {label}
      </div>
    );
  }

  return (
    <DivLink to={url} className={className} testId={testId}>
      {icon && <span className="h-4 w-4 hidden sm:inline">{icon}</span>}
      {label}
    </DivLink>
  );
}

const isStorybook = () => {
  return typeof window !== "undefined" && window.STORYBOOK_ENV === true;
};

const getTabUrl = (tab: WorkMap.Filter) => {
  if (isStorybook()) {
    return "#";
  }

  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set("tab", tab);

  return `?${searchParams.toString()}`;
};
