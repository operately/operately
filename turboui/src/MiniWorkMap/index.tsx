import { BlackLink } from "../Link";
import { AvatarList } from "../Avatar";
import { IconCircleCheckFilled, IconHexagons, IconTarget } from "@tabler/icons-react";

export namespace MiniWorkMap {
  interface Person {
    id: string;
    fullName: string;
    avatarUrl: string;
  }

  export interface WorkItem {
    id: string;
    type: "goal" | "project";
    status: "on_track" | "caution" | "concern" | "issue" | "paused" | "outdated" | "pending";
    name: string;
    link: string;
    progress: number;
    subitems: WorkItem[];
    completed: boolean;
    people: Person[];
  }

  export interface Props {
    items: WorkItem[];
  }
}

export function MiniWorkMap(props: MiniWorkMap.Props) {
  return (
    <div className="flex flex-col gap-2">
      {props.items.map((item) => (
        <ItemView key={item.id} item={item} depth={0} />
      ))}
    </div>
  );
}

function ItemView({ item, depth }: { item: MiniWorkMap.WorkItem, depth: number }) {
  return (
    <>
      <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
        <ItemIcon item={item} />
        <ItemName item={item} />
        <Dots />
        <ItemPeople item={item} />
        <Progress item={item} />
      </div>

      <Subitems items={item.subitems} depth={depth + 1} />
    </>
  );
}

function Subitems({ items, depth }: { items: MiniWorkMap.WorkItem[], depth: number }) {
  return <>
    {items.map((subitem) => (
      <ItemView key={subitem.id} item={subitem} depth={depth} />
    ))}
  </>
}

function ItemIcon({ item }: { item: MiniWorkMap.WorkItem }) {
  if(item.type === "goal") {
   return <IconTarget size={16} className="text-red-500" />
  }

  if(item.type === "project") {
    return <IconHexagons size={16} className="text-indigo-500" />
  }

  throw new Error(`Unknown item type: ${item.type}`);
}

function ItemPeople({ item }: { item: MiniWorkMap.WorkItem }) {
  return <div className="shrink-0">
    <AvatarList people={item.people} size={20} stacked />
  </div>
}

function ItemName({ item }: { item: MiniWorkMap.WorkItem }) {
  const nameElement = (
    <BlackLink underline="hover" to={item.link} className="truncate" disableColorHoverEffect>
      {item.name}
    </BlackLink>
  );

  if (!item.completed) return nameElement;
  
  return (
    <>
      <s>{nameElement}</s>
      <IconCircleCheckFilled size={16} className="text-green-700" />
      <div className="text-sm text-green-700 font-medium">Done</div>
    </>
  );
}


function Dots() {
  return <div className="border-t-2 border-dotted border-stroke-base flex-1 mx-1" />;
}

const PROGRESS_COLORS: Record<string, string> = {
  on_track: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  caution: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  concern: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  issue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  paused: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  outdated: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

function Progress({ item }: { item: MiniWorkMap.WorkItem }) {
  if(isNaN(item.progress)) {
    throw new Error(`Progress is NaN for item: ${item.name}`);
  }

  const color = PROGRESS_COLORS[item.status];

  if(!color) {
    throw new Error(`Unknown status color for item: ${item.name}`);
  }

  const outerClass = `w-11 flex justify-center rounded-lg px-2 py-0.5 shrink-0 ${color}`;
  const innerClass = `text-sm font-medium font-mono`;
  const progress = Math.floor(item.progress);

  return (
    <div className={outerClass}>
      <div className={innerClass}>{progress}%</div>
    </div>
  );
}
