import WorkMap from "..";
import classNames from "../../../utils/classnames";

interface Props {
  item: WorkMap.Item;
  children: React.ReactNode;
}

export function RowContainer({ item, children }: Props) {
  const className = classNames(
    "group border-b border-stroke-base transition-all duration-150 ease-in-out cursor-pointer relative",
    Boolean(item.isNew) && "bg-amber-50/70 dark:bg-amber-900/20",
    "bg-surface-base hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20",
  );

  return (
    <tr data-workmap-selectable="true" className={className}>
      {children}
    </tr>
  );
}
