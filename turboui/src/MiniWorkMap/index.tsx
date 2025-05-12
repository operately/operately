import { match } from "ts-pattern";
import { z } from "zod";
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
  const PersonSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    avatarUrl: z.string(),
  });

  export const WorkItemsSchema = z.object({
    id: z.string(),
    type: z.enum(["goal", "project"]),
    status: z.enum(["on_track", "caution", "concern", "issue", "paused", "outdated", "pending"]),
    name: z.string(),
    link: z.string(),
    progress: z.number(),
    subitems: z.array(z.lazy(() => WorkItemsSchema)),
    completed: z.boolean(),
    people: z.array(PersonSchema),
  });

  export const PropsSchema = z.object({
    items: z.array(WorkItemsSchema),
  });

  export type WorkItem = z.infer<typeof WorkItemsSchema>;
  export type Props = z.infer<typeof PropsSchema>;
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
        <StatusBadge status={item.status} />
      </div>

      <Subitems items={item.subitems} depth={depth + 1} />
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
      <AvatarList people={item.people} size={18} stacked />
    </div>
  );
}

function ItemName({ item }: { item: MiniWorkMap.WorkItem }) {
  const nameElement = (
    <BlackLink underline="hover" to={item.link} className="truncate" disableColorHoverEffect>
      {item.name}
    </BlackLink>
  );

  if (!item.completed) return nameElement;

  return <s>{nameElement}</s>;
}
