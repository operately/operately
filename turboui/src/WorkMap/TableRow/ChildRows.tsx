import { WorkMapItem } from "../types";
import { useTableRowContext } from "./context";
import { TableRow } from "./index";

export function ChildRows() {
  const { 
    item, 
    expanded, 
    hasChildren, 
    level, 
    isLastItem, 
    filter, 
    selectedItemId, 
    onRowClick 
  } = useTableRowContext();

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
          isLast={index === item.children!.length - 1 && isLastItem}
          filter={filter}
          selectedItemId={selectedItemId}
          onRowClick={onRowClick}
        />
      ))}
    </>
  );
}
