import React from "react";
import { TabProps } from "./Tab";

interface HeaderProps {
  tabs: React.ReactElement<TabProps>[];
  active: string;
  onTabChange: (path: string) => void;
}

function Header({ tabs, onTabChange, active }: HeaderProps) {
  return (
    <div
      className="flex items-center gap-[24px] bg-white mt-[26px]"
      style={{
        boxShadow: "inset 0px -1px 0px #EEEEEE",
      }}
    >
      {tabs.map((tab, index) =>
        React.cloneElement(tab, {
          key: index,
          active: isTabActive(tab, active),
          onClick: onTabChange,
        })
      )}
    </div>
  );
}

interface ActiveTabContentProps {
  tabs: React.ReactElement<TabProps>[];
  active: string;
}

function ActiveTabContent({ tabs, active }: ActiveTabContentProps) {
  const activeTab = findActiveTab(tabs, active);

  if (!activeTab) {
    throw "Unknown tab " + active;
  }

  return activeTab.props.element;
}

interface ContainerProps {
  children: React.ReactElement<TabProps>[];
  active: string;
  basePath: string;
}

export default function Container(props: ContainerProps) {
  const tabs = props.children;
  const [active, setActive] = React.useState("/" + props.active);

  const onTabChange = (path: string) => {
    history.pushState({}, "", props.basePath + path);
    setActive(path);
  };

  return (
    <>
      <Header onTabChange={onTabChange} active={active} tabs={tabs} />
      <ActiveTabContent active={active} tabs={tabs} />
    </>
  );
}

function isTabActive(tab: React.ReactElement<TabProps>, active: string) {
  return tab.props.path === active;
}

function findActiveTab(tabs: React.ReactElement<TabProps>[], active: string) {
  return tabs.find((tab) => isTabActive(tab, active));
}
