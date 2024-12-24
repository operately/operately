import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { GhostButton } from "@/components/Buttons";
import classNames from "classnames";

export function ZeroState() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <GoalTreeExample />
      <ExplanationAndButton />
    </div>
  );
}

function ExplanationAndButton() {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="text-base font-bold">Goals &amp; Projects</div>

      <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
        Set goals, track your progress, and collaborate with your team to achieve them.
      </div>

      <GhostButton size="sm">Add goal or project</GhostButton>
    </div>
  );
}

function GoalTreeExample() {
  return (
    <div className="relative w-full h-[170px] mt-10 opacity-75 px-[50px] flex flex-col gap-3">
      <div className="flex flex-col">
        <WorkItem title="Yearly Goal" progress={20} />
        <WorkItem title="Quarterly Goal 1" progress={60} indent={1} />
        <WorkItem title="Project 1" progress={90} indent={2} type="project" />
        <WorkItem title="Quarterly Goal 2" progress={60} indent={1} />
      </div>
    </div>
  );
}

function WorkItem({ indent = 0, progress = 20, title, type = "goal" }) {
  const style = { paddingLeft: `${indent * 25}px` };

  const className = classNames(
    "flex items-center justify-between",
    "transition-all",
    "first:border-t border-b border-stroke-base",
    "py-1.5",
  );

  return (
    <div className={className} style={style}>
      <div className="flex items-center gap-2.5 group-hover:gap-3 transition-all">
        <WorkItemIcon type={type} />
        <div className="font-bold text-[12px] leading-none">{title}</div>
      </div>
      <div>
        <ExampleProgressBar progress={progress} />
      </div>
    </div>
  );
}

function WorkItemIcon({ type }) {
  const iconType = type === "goal" ? Icons.IconTargetArrow : Icons.IconHexagons;

  const klass = classNames(
    "p-1",
    "rounded-full",
    "transition-all",
    "bg-stone-100 dark:bg-stone-600",
    {
      "group-hover:bg-red-50": type === "goal",
      "group-hover:text-red-600": type === "goal",
      "dark:group-hover:text-white-1": type === "goal",
      "dark:group-hover:bg-red-500": type === "goal",
    },
    {
      "group-hover:bg-indigo-50": type === "project",
      "group-hover:text-indigo-600": type === "project",
      "dark:group-hover:text-white-1": type === "project",
      "dark:group-hover:bg-indigo-500": type === "project",
    },
  );

  return <div className={klass}>{React.createElement(iconType, { size: 16, stroke: 1.75 })}</div>;
}

function ExampleProgressBar({ progress }) {
  const className = classNames("h-2 bg-surface-outline rounded relative w-8");

  const innerClassName = classNames(
    "bg-accent-1 rounded",
    "absolute top-0 bottom-0 left-0",
    "bg-stone-400 group-hover:bg-accent-1 transition-all group-hover:scale-105",
  );

  return (
    <div className={className}>
      <div className={innerClassName} style={{ width: `${progress}%` }} />
    </div>
  );
}
