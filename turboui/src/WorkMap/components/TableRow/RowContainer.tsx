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
    "bg-surface-base hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20",
  );

  const testId = createTestId(item.type, item.name);

  const rowRef = React.useRef<HTMLTableRowElement>(null);

  React.useEffect(() => {
    if (!item.isNew || !rowRef.current) return;

    const row = rowRef.current;
    row.classList.add("bg-amber-50/70", "dark:bg-amber-900/20", "transition-colors");

    const timeout = setTimeout(() => {
      row.classList.remove("bg-amber-50/70", "dark:bg-amber-900/20", "transition-colors");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [item.isNew]);

  return (
    <tr ref={rowRef} data-workmap-selectable="true" className={className} data-test-id={testId}>
      {children}
    </tr>
  );
}
