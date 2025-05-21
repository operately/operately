import { IconHome, IconSettings, IconUser } from "@tabler/icons-react";
import React from "react";
import { Tabs, useTabs } from ".";

export default {
  title: "Components/Tabs",
  component: Tabs,
  decorators: [
    (Story) => (
      <div className="bg-surface-base dark:bg-surface-dark h-96 max-w-2xl mx-auto pt-4 my-8 rounded-lg shadow">
        <Story />
      </div>
    ),
  ],
};

const tabList = [
  { id: "home", label: "Home", icon: <IconHome size={16} /> },
  { id: "profile", label: "Profile", icon: <IconUser size={16} /> },
  { id: "settings", label: "Settings", icon: <IconSettings size={16} /> },
];

export const Default = () => {
  const tabs = useTabs("home", tabList);
  return <Tabs tabs={tabs} />;
};

export const WithCounts = () => {
  const tabs = useTabs("home", [
    { id: "home", label: "Home", icon: <IconHome size={16} />, count: 3 },
    { id: "profile", label: "Profile", icon: <IconUser size={16} />, count: 0 },
    { id: "settings", label: "Settings", icon: <IconSettings size={16} />, count: 7 },
  ]);
  return <Tabs tabs={tabs} />;
};
