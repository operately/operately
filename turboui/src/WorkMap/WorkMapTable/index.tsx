import { QuickAddRow } from "./QuickAddRow";
import { TableHeader } from "./TableHeader";
import { TableRow } from "../TableRow";
import { NewItem, WorkMapItem } from "../types";

export interface Props {
  items: WorkMapItem[];
  deleteItem: (itemId: string) => void;
  addItem: (newItem: NewItem) => void;
}

export function WorkMapTable({ items, deleteItem, addItem }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-surface-outline">
        <TableHeader filter="all" />
        <tbody>
          {items.map((item, idx) => (
            <TableRow
              key={item.id}
              item={item}
              level={0}
              isLast={idx === items.length - 1}
              filter="all"
              onDelete={() => deleteItem(item.id)}
              addItem={addItem}
            />
          ))}

          <QuickAddRow filter="all" addItem={addItem} />
        </tbody>
      </table>
    </div>
  );
}

export default WorkMapTable;
