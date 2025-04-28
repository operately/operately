import { QuickAddRow } from "./QuickAddRow";
import { TableHeader } from "./TableHeader";
import { WorkMap } from "..";
import { TableRow } from "../TableRow";

export interface Props {
  items: WorkMap.Item[];
  filter: WorkMap.Filter;
}

export function WorkMapTable({ items, filter }: Props) {
  return (
    <div className="overflow-x-auto bg-surface-base rounded-b-lg">
      <table className="min-w-full divide-y divide-surface-outline">
        <TableHeader filter={filter} />
        <tbody>
          {items.map((item, idx) => (
            <TableRow key={item.id} item={item} level={0} isLast={idx === items.length - 1} filter={filter} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WorkMapTable;
