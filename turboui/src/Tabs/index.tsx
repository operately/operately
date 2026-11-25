// Tabs in this file are controlled by the URL query parameter (e.g., ?tab=tabId).
// The useTabs hook uses react-router's useLocation to read the current tab query parameter from the URL.
// Whenever the query parameter changes (via navigation, clicking a tab, or browser navigation),
// useTabs will update the active tab accordingly. This ensures the tab state is always
// in sync with the URL, and works seamlessly with React Router navigation.
//
// To add a new tab, add a Tab object to the tabs array with a unique id (which will be used as the tab query parameter).
// Clicking a tab updates the tab query parameter in the URL, which triggers a re-render with the new active tab.
//
// If you need to control the active tab from a parent component, pass the correct tab query parameter in the URL.
//
// This approach does not require manual event listeners for popstate, as React Router
// handles location changes and triggers re-renders automatically.

import React from "react";
import { useLocation } from "react-router";

import { DivLink } from "../Link";
import classNames from "../utils/classnames";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  hidden?: boolean;
  testId?: string;
}

interface TabsConfig {
  urlPath?: string;
}

export interface TabsState {
  active: string;
  tabs: Tab[];
  urlPath?: string;
}

export function useTabs(defaultTab: string, tabs: Tab[], config?: TabsConfig): TabsState {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const active = searchParams.get("tab") || defaultTab;

  return {
    active,
    tabs: tabs.filter((tab) => !tab.hidden),
    urlPath: config?.urlPath,
  };
}

function useTabPath(tabId: string, urlPath?: string) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  searchParams.set("tab", tabId);
  const pathname = urlPath || location.pathname;
  return `${pathname}?${searchParams.toString()}`;
}

// Supply onChange for local state; omit it for the existing URL-based navigation.
export function Tabs({
  tabs,
  showBorder = true,
  onChange,
}: {
  tabs: TabsState;
  showBorder?: boolean;
  onChange?: (id: string) => void;
}) {
  return (
    <div
      className={classNames("min-w-0 pl-1 mt-2 sm:pl-4", {
        "border-stroke-base border-b shadow-b-xs": showBorder,
      })}
    >
      <nav className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 px-1 sm:gap-x-4 sm:pl-0">
        {tabs.tabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} activeTab={tabs.active} urlPath={tabs.urlPath} onChange={onChange} />
        ))}
      </nav>
    </div>
  );
}

function TabItem({
  tab,
  activeTab,
  urlPath,
  onChange,
}: {
  tab: Tab;
  activeTab: string;
  urlPath?: string;
  onChange?: (id: string) => void;
}) {
  const tabPath = useTabPath(tab.id, urlPath);
  const testId = `tab-${(tab.testId ?? tab.label).toLowerCase()}`;

  const labelClass = classNames(
    "relative -mb-px flex w-max max-w-full min-w-0 items-center gap-1 px-1 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-1 sm:-mx-1.5 sm:px-1.5",
    {
      "text-white rounded-t": activeTab === tab.id,
      "text-content-dimmed hover:text-content-base": activeTab !== tab.id,
      "hover:bg-surface-dimmed rounded-lg": activeTab !== tab.id,
    },
  );

  const content = (
    <>
      <span className="hidden flex-shrink-0 sm:inline-flex">{tab.icon}</span>
      <span className="min-w-0 break-words leading-none sm:ml-1 sm:min-w-fit">{tab.label}</span>
      <TabCountBadge count={tab.count} />
    </>
  );

  return (
    <div className="relative w-max max-w-full flex-none pb-1.5">
      {onChange ? (
        <button
          type="button"
          className={labelClass}
          onClick={() => onChange(tab.id)}
          aria-pressed={activeTab === tab.id}
          data-test-id={testId}
        >
          {content}
        </button>
      ) : (
        <DivLink className={labelClass} to={tabPath} testId={testId}>
          {content}
        </DivLink>
      )}

      <TabUnderline isActive={activeTab === tab.id} />
    </div>
  );
}

function TabUnderline({ isActive }: { isActive: boolean }) {
  const underlineClass = classNames(
    "absolute inset-x-0 bottom-0 h-[1.5px] bg-blue-500 transition-all duration-200 ease-in-out",
    {
      "scale-x-100": isActive,
      "scale-x-0": !isActive,
    },
  );

  return <div className={underlineClass} />;
}

function TabCountBadge({ count }: { count?: number }) {
  if (!count || count <= 0) {
    return null;
  } else {
    return <span className="bg-stone-100 dark:bg-stone-900 text-xs font-medium rounded-lg px-1.5">{count}</span>;
  }
}
