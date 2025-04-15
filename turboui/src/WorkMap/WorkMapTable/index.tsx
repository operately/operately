import { QuickAddRow } from "./QuickAddRow";
import { TableHeader } from "./TableHeader";
import { NewItem, WorkMapFilter, WorkMapItem } from "../types";
import { TableRow } from "../TableRow";

export interface Props {
  items: WorkMapItem[];
  filter: WorkMapFilter;
  deleteItem: (itemId: string) => void;
  addItem: (newItem: NewItem) => void;
}

export function WorkMapTable({ items, filter, deleteItem, addItem }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-surface-outline">
        <TableHeader filter={filter} />
        <tbody>
          {items.map((item, idx) => (
            <TableRow
              key={item.id}
              item={item}
              level={0}
              isLast={idx === items.length - 1}
              filter={filter}
              onDelete={() => deleteItem(item.id)}
              addItem={addItem}
            />
          ))}

          <QuickAddRow filter={filter} addItem={addItem} />
        </tbody>
      </table>
    </div>
  );
}

export default WorkMapTable;
