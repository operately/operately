import React from "react";
import { useLocation } from "react-router-dom";
import { IconChartColumn, IconTable } from "../../icons";
import { DivLink } from "../../Link";
import { Tabs, TabsState } from "../../Tabs";
import classNames from "../../utils/classnames";
import { WorkMap } from ".";

export interface Props {
  tabsState: TabsState;
  timelineAvailable?: boolean;
  view?: WorkMap.View;
}

export function WorkMapNavigation({ tabsState, timelineAvailable = false, view = "table" }: Props) {
  const location = useLocation();
  const tablePath = buildViewPath(location.pathname, location.search, "table");
  const timelinePath = buildViewPath(location.pathname, location.search, "timeline");

  return (
    <div className="flex items-end justify-between gap-4 px-4">
      <div className="min-w-0 flex-1 overflow-x-auto">
        <Tabs tabs={tabsState} />
      </div>

      {timelineAvailable && (
        <div className="mb-2 flex shrink-0 items-center gap-1 rounded-lg border border-surface-outline bg-surface-dimmed p-1">
          <ViewToggleButton label="Table" icon={<IconTable size={15} />} to={tablePath} active={view === "table"} />
          <ViewToggleButton
            label="Timeline"
            icon={<IconChartColumn size={15} />}
            to={timelinePath}
            active={view === "timeline"}
          />
        </div>
      )}
    </div>
  );
}

export default WorkMapNavigation;

function buildViewPath(pathname: string, search: string, view: WorkMap.View) {
  const searchParams = new URLSearchParams(search);

  if (view === "timeline") {
    searchParams.set("view", "timeline");
  } else {
    searchParams.delete("view");
  }

  const nextSearch = searchParams.toString();
  return nextSearch ? `${pathname}?${nextSearch}` : pathname;
}

function ViewToggleButton({
  label,
  icon,
  to,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  to: string;
  active: boolean;
}) {
  return (
    <DivLink
      to={to}
      className={classNames(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-surface-base text-content-accent shadow-sm" : "text-content-dimmed hover:text-content-base",
      )}
    >
      {icon}
      <span>{label}</span>
    </DivLink>
  );
}
