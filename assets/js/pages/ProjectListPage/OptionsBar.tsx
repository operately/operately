import React from "react";
import * as Icons from "@tabler/icons-react";

interface OptionsState {
  layout: "grid" | "list";
  filter: "in-progress" | "archived";

  setLayout: (layout: "grid" | "list") => void;
  setFilter: (filter: "in-progress" | "archived") => void;
}

export function useOptionsState(): OptionsState {
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const [filter, setFilter] = React.useState<"in-progress" | "archived">("in-progress");

  return { layout, setLayout, filter, setFilter };
}

export function OptionsBar({ options }: { options: OptionsState }) {
  const setGrid = () => options.setLayout("grid");
  const setList = () => options.setLayout("list");
  const setInProgress = () => options.setFilter("in-progress");
  const setArchived = () => options.setFilter("archived");

  return (
    <div className="bg-dark-2 rounded-lg mb-4 flex justify-between p-4 shadow-xl">
      <div className="flex items-center gap-4">
        <FilterTab active={options.filter === "in-progress"} onClick={setInProgress} title="In Progress" />
        <FilterTab active={options.filter === "archived"} onClick={setArchived} title="Archived" />
      </div>

      <div className="flex items-center gap-2">
        <LayoutButton icon={Icons.IconLayoutGrid} active={options.layout === "grid"} onClick={setGrid} />
        <LayoutButton icon={Icons.IconLayoutList} active={options.layout === "list"} onClick={setList} />
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, title }: { active: boolean; onClick: () => void; title: string }) {
  const activeStyle = "text-white-1 border-b-2 border-green-400";
  const inactiveStyle = "text-white-2 hover:text-white-1/80";
  const className = (active ? activeStyle : inactiveStyle) + " font-medium pb-1 -mb-1 cursor-pointer transition-colors";

  return <div className={className} onClick={onClick} children={title} />;
}

function LayoutButton({ icon, active, onClick }: { icon: any; active: boolean; onClick: () => void }) {
  const Icon = icon;

  const activeStyle = "text-white-1";
  const inactiveStyle = "text-white-2 hover:text-white-1/80";
  const className = (active ? activeStyle : inactiveStyle) + " cursor-pointer transition-colors";

  return <Icon className={className} size={20} onClick={onClick} />;
}
