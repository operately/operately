import { WorkMapItem } from "../types";
import { useTableRowContext } from "./context";
import { TableRow } from "./index";

interface Props {
  item: WorkMapItem;
  level: number;
  isLast: boolean;
  filter?: string;
  selectedItemId?: string;
  onRowClick?: (item: WorkMapItem) => void;
  onDelete: () => void;
}

export function ChildRows({item, level, isLast, filter, selectedItemId, onRowClick, onDelete}: Props) {
  const { expanded, hasChildren } = useTableRowContext();

  if (!expanded || !hasChildren) {
    return null;
  }

  return (
    <>
      {item.children?.map((child: WorkMapItem, index: number) => (
        <TableRow
          key={child.id}
          item={child}
          level={level + 1}
          isLast={index === item.children!.length - 1 && isLast}
          filter={filter}
          selectedItemId={selectedItemId}
          onRowClick={onRowClick}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
