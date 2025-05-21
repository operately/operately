import React from "react";
import { match } from "ts-pattern";
import { AvatarList } from "../Avatar";
import { IconGoal, IconProject } from "../icons";
import { BlackLink } from "../Link";
import { StatusBadge } from "../StatusBadge";

export function MiniWorkMap(props: MiniWorkMap.Props) {
  return (
    <div className="flex flex-col">
      {props.items.map((item) => (
        <ItemView key={item.id} item={item} depth={0} />
      ))}
    </div>
  );
}

export namespace MiniWorkMap {
  interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  }

  export interface WorkItem {
    id: string;
    type: "goal" | "project";
    state: "active" | "paused" | "closed";
    status:
      | "on_track"
      | "completed"
      | "achieved"
      | "partial"
      | "missed"
      | "paused"
      | "caution"
      | "issue"
      | "dropped"
      | "pending"
      | "outdated";
    name: string;
    itemPath: string;
    progress: number;
    children?: WorkItem[];
    assignees: Person[];
  }

  export interface Props {
    items: WorkItem[];
  }
}

function ItemView({ item, depth }: { item: MiniWorkMap.WorkItem; depth: number }) {
  return (
    <>
      <div
        className="flex items-center gap-2 border-t last:border-b border-stroke-base py-1.5"
        style={{ paddingLeft: depth * 20 }}
      >
        <ItemIcon item={item} />
        <ItemName item={item} />
        <ItemPeople item={item} />
        <div className="flex-1" />
        <div className="shrink-0">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {item.children && <Subitems items={item.children} depth={depth + 1} />}
    </>
  );
}

function Subitems({ items, depth }: { items: MiniWorkMap.WorkItem[]; depth: number }) {
  return (
    <>
      {items.map((subitem) => (
        <ItemView key={subitem.id} item={subitem} depth={depth} />
      ))}
    </>
  );
}

function ItemIcon({ item }: { item: MiniWorkMap.WorkItem }) {
  return match(item.type)
    .with("goal", () => <IconGoal size={20} />)
    .with("project", () => <IconProject size={20} />)
    .otherwise(() => {
      throw new Error(`Unknown item type: ${item.type}`);
    });
}

function ItemPeople({ item }: { item: MiniWorkMap.WorkItem }) {
  return (
    <div className="shrink-0">
      <AvatarList people={item.assignees} size={18} stacked />
    </div>
  );
}

function ItemName({ item }: { item: MiniWorkMap.WorkItem }) {
  const nameElement = (
    <BlackLink underline="hover" to={item.itemPath} className="truncate" disableColorHoverEffect>
      {item.name}
    </BlackLink>
  );

  if (item.state === "closed") {
    return <s className="truncate">{nameElement}</s>;
  } else {
    return nameElement;
  }
}
