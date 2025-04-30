import classNames from "../../../utils/classnames";
import { useTableRowContext } from "./context";

interface Props {
  children: React.ReactNode;
}

export function RowContainer({ children }: Props) {
  const {
    item,
    isSelected,
    handleRowClick,
    setShowAddButton
  } = useTableRowContext();
  
  const className = classNames(
    "group border-b border-stroke-base transition-all duration-150 ease-in-out cursor-pointer relative",
    Boolean(item.isNew) && "bg-amber-50/70 dark:bg-amber-900/20",
    isSelected
      ? "bg-surface-highlight dark:bg-surface-dimmed/30"
      : "bg-surface-base hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20"
  )

  return (
    <tr
      data-workmap-selectable="true"
      className={className}
      onClick={handleRowClick}
      onMouseEnter={() => setShowAddButton(true)}
      onMouseLeave={() => setShowAddButton(false)}
    >
      {children}
    </tr>
  );
}