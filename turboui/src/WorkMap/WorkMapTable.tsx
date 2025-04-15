import React from "react";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { WorkMapItem } from "./types";

export interface WorkMapTableProps {
  items: WorkMapItem[];
  deleteItem: (itemId: string) => void;
}

export function WorkMapTable({ items, deleteItem }: WorkMapTableProps) {
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WorkMapTable;
