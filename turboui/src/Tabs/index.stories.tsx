import { IconHome, IconSettings, IconUser } from "../icons";
import React from "react";
import { Tabs, useTabs } from ".";
import { useProjectPageTabs } from "../ProjectPageLayout/useProjectPageTabs";

export default {
  title: "Components/Tabs",
  component: Tabs,
  decorators: [
    (Story, context) => (
      <div
        className={`bg-surface-base dark:bg-surface-dark h-96 mx-auto pt-4 my-8 rounded-lg shadow ${
          context.name === "Project Overflow" ? "max-w-5xl" : "max-w-2xl"
        }`}
      >
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

export const ProjectOverflow = () => {
  const tabs = useProjectPageTabs({
    defaultTab: "overview",
    childrenCount: { tasksCount: 4, checkInsCount: 1, discussionsCount: 2, docsAndFilesCount: 3 },
    showDocsAndFiles: true,
  });

  // The German catalog translates "Docs & Files" to this longer label.
  const translatedTabs = {
    ...tabs,
    tabs: tabs.tabs.map((tab) => (tab.id === "docs-and-files" ? { ...tab, label: "Dokumente & Dateien" } : tab)),
  };

  return (
    <>
      <Tabs tabs={translatedTabs} />
      <output data-test-id="active-tab" className="block mt-4 px-4">
        {tabs.active}
      </output>
    </>
  );
};

ProjectOverflow.parameters = { reactRouter: { path: "/?ref=storybook" } };

export const OversizedLabel = () => {
  const tabs = useTabs("docs", [{ id: "docs", label: "Dokumente & Dateien", icon: null, count: 3 }]);

  return (
    <div className="w-32">
      <Tabs tabs={tabs} />
    </div>
  );
};

export const LocalSelection = () => {
  const [active, setActive] = React.useState("home");
  const tabs = useTabs("home", tabList);

  return (
    <>
      <Tabs tabs={{ ...tabs, active }} onChange={setActive} />
      <output data-test-id="active-tab" className="block mt-4 px-4">
        {active}
      </output>
    </>
  );
};
