import React from "react";
import { WorkMap } from "..";
import { SpaceField } from "../../../SpaceField";
import { TableRow } from "./index";

interface Props {
  item: WorkMap.Item;
  level: number;
  isLast: boolean;
  tab: WorkMap.Filter;
  selectedItemId?: string;
  onRowClick?: (item: WorkMap.Item) => void;
  expanded: boolean;
  showIndentation: boolean;
  addItem: WorkMap.AddNewItemFn;
  addingEnabled?: boolean;
  spaceSearch: SpaceField.SearchSpaceFn;
}

export function ChildRows({ item, level, isLast, expanded, ...rest }: Props) {
  const hasChildren = Boolean(item.children && item.children.length > 0);

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
