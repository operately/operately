import React from "react";
import WorkMap from "..";
import { createTestId } from "../../../TestableElement";
import classNames from "../../../utils/classnames";

interface Props {
  item: WorkMap.Item;
  children: React.ReactNode;
}

export function RowContainer({ item, children }: Props) {
  const className = classNames(
    "group/row",
    "group border-b border-stroke-base transition-all duration-150 ease-in-out relative",
    Boolean(item.isNew) && "bg-amber-50/70 dark:bg-amber-900/20",
    "bg-surface-base hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20",
  );
  const testId = createTestId(item.type, item.name);

  return (
    <tr data-workmap-selectable="true" className={className} data-test-id={testId}>
      {children}
    </tr>
  );
}
