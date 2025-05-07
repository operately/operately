import { useNavigate } from "react-router-dom";
import WorkMap from "..";
import classNames from "../../../utils/classnames";

interface Props {
  item: WorkMap.Item;
  children: React.ReactNode;
}

export function RowContainer({ item, children }: Props) {
  const navigate = useNavigate();

  const className = classNames(
    "group border-b border-stroke-base transition-all duration-150 ease-in-out cursor-pointer relative",
    Boolean(item.isNew) && "bg-amber-50/70 dark:bg-amber-900/20",
    "bg-surface-base hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20",
  );

  // Handle row click to navigate, but exclude clicks on elements with the data-exclude-row-click attribute
  const handleRowClick = (e: React.MouseEvent) => {
    const isExcludedClick = (e.target as HTMLElement)?.closest("[data-exclude-row-click]");

    if (!isExcludedClick && item.itemPath) {
      navigate(item.itemPath);
    }
  };

  return (
    <tr data-workmap-selectable="true" className={className} onClick={handleRowClick}>
      {children}
    </tr>
  );
}
