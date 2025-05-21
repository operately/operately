import React from "react";

import { IconClipboardText, IconMessage } from "@tabler/icons-react";
import classNames from "../utils/classnames";

interface GoalTabsProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  checkInCount: number;
}

export function GoalTabs(props: GoalTabsProps) {
  const tabs = [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "check-ins", label: "Check-Ins", icon: <IconMessage size={14} />, count: props.checkInCount },
  ];

  return (
    <div className="border-b shadow-b-xs pl-4 mt-2">
      <nav className="flex gap-4 px-2 sm:px-0">
        {tabs.map((tab) => (
          <Tab key={tab.id} {...tab} activeTab={props.activeTab} setActiveTab={props.setActiveTab} />
        ))}
      </nav>
    </div>
  );
}

interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeTab: string;
  count?: number;
  setActiveTab: (id: string) => void;
}

function Tab({ id, label, icon, activeTab, setActiveTab, count }: TabProps) {
  const labelClass = classNames("flex items-center gap-1 px-1.5 py-1.5 text-sm relative -mb-px font-medium -mx-1.5", {
    "text-white rounded-t": activeTab === id,
    "text-content-dimmed hover:text-content-base": activeTab !== id,
    "hover:bg-surface-dimmed rounded-lg": activeTab !== id,
  });

  const underlineClass = classNames(
    "absolute inset-x-0 bottom-0 h-[1.5px] bg-blue-500 transition-all duration-200 ease-in-out",
    {
      "scale-x-100": activeTab === id,
      "scale-x-0": activeTab !== id,
    },
  );

  return (
    <div className="relative pb-1.5">
      <button className={labelClass} style={{ outline: "none" }} onClick={() => setActiveTab(id)} type="button">
        {icon}
        <span className="leading-none">{label}</span>

        {Boolean(count && count > 0) && (
          <span className="bg-stone-100 dark:bg-stone-900 text-xs font-medium rounded-lg px-1.5">{count}</span>
        )}
      </button>

      <div className={underlineClass} />
    </div>
  );
}
