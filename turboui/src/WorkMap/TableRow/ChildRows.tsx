import { WorkMap } from "..";
import { useTableRowContext } from "./context";
import { TableRow } from "./index";

interface Props {
  item: WorkMap.Item;
  level: number;
  isLast: boolean;
  filter: WorkMap.Filter;
  selectedItemId?: string;
  onRowClick?: (item: WorkMap.Item) => void;
  onDelete: () => void;
  addItem: (newItem: WorkMap.NewItem) => void;
}

export function ChildRows({ item, level, isLast, ...rest }: Props) {
  const { expanded, hasChildren } = useTableRowContext();

  if (!expanded || !hasChildren) {
    return null;
  }

  return (
    <>
      {item.children?.map((child: WorkMap.Item, index: number) => (
        <TableRow
          key={child.id}
          item={child}
          level={level + 1}
          isLast={index === item.children!.length - 1 && isLast}
          {...rest}
        />
      ))}
    </>
  );
}
