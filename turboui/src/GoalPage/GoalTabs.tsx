import React from "react";

import { IconClipboardText, IconMessage } from "@tabler/icons-react";
import classNames from "../utils/classnames";

export function GoalTabs() {
  const [activeTab, setActiveTab] = React.useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "checkins", label: "Check-Ins", icon: <IconMessage size={14} /> },
  ];

  const tabClass = (active: boolean) =>
    classNames("flex items-center gap-1 mt-8 pb-2.5 px-0.5 text-sm relative border-b-[1.5px] -mb-px font-medium", {
      "text-content-base border-content-base": active,
      "text-content-dimmed hover:text-content-base border-transparent": !active,
    });

  return (
    <div className="border-b shadow-b-xs px-6">
      <nav className="flex gap-4 px-2 sm:px-0 mt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={tabClass(activeTab === tab.id)}
            style={{ outline: "none" }}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.icon}
            <span className="leading-none">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
