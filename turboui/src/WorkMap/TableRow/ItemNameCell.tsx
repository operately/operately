import { IconTarget, IconChecklist, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { BlackLink } from "../../Link";
import classNames from "../../utils/classnames";
import { useItemStatus } from "../hooks/useItemStatus";
import { useTableRowContext } from "./context";
import { PrivacyIndicator } from "../../PrivacyIndicator";

export function ItemNameCell() {
  return (
    <td className="py-2 px-2 md:px-4 relative">
      <div className="flex items-center">
        <Indentation />
        <ExpandButton />
        <Icon />
        <Name />
        <PrivacyIndicatorWrapper />
      </div>
    </td>
  );
}

function Name() {
  const { item } = useTableRowContext();
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(item.status);

  const textStyle = classNames(
    "font-medium text-xs md:text-sm hover:underline transition-colors",
    {
      "line-through": isCompleted || isFailed,
      "line-through opacity-70": isDropped,
      "text-content-dimmed dark:text-gray-400": isPending,
    },
    isCompleted || isFailed || isDropped
      ? "text-content-dimmed dark:text-gray-400"
      : isCompleted || isFailed || isDropped
      ? "text-content-dimmed dark:text-gray-400"
      : "text-content-base dark:text-gray-200 hover:text-link-hover dark:hover:text-white",
  );

  return (
    <div className="flex items-center">
      <BlackLink to={item.itemPath!} className={textStyle} underline="hover">
        {item.name}
      </BlackLink>
    </div>
  );
}

function Icon() {
  const { item } = useTableRowContext();
  const isGoal = item.type === "goal";
  const isProject = item.type === "project";

  const className = classNames(
    "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-2",
    isGoal
      ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
      : "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
  );

  return (
    <div className={className}>
      {isGoal && <IconTarget size={12} />}
      {isProject && <IconChecklist size={12} />}
    </div>
  );
}

function Indentation() {
  const { showIndentation, indentPadding } = useTableRowContext();

  if (!showIndentation) return null;

  return <div style={{ width: `${indentPadding}px` }} className="flex-shrink-0" />;
}

function ExpandButton() {
  const { expanded, hasChildren, setExpanded, filter } = useTableRowContext();

  const handleExpandToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Skip indentation on completed and projects views
  if (filter === "completed" || filter === "projects") return null;

  if (!hasChildren) return <div className="w-[16px] sm:w-[24px]"></div>;

  return (
    <button
      onClick={handleExpandToggle}
      className="mr-2 text-content-dimmed hover:text-content-base dark:text-gray-400 dark:hover:text-gray-300"
    >
      {/* Use responsive size for chevron icons - smaller on mobile */}
      <div className="hidden sm:block">
        <ChevronIcon expanded={expanded} size={16} />
      </div>
      <div className="sm:hidden">
        <ChevronIcon expanded={expanded} size={12} />
      </div>
    </button>
  );
}

function ChevronIcon({ expanded, size }: { expanded: boolean; size: number }) {
  if (expanded) {
    return <IconChevronDown size={size} />;
  } else {
    return <IconChevronRight size={size} />;
  }
}

function PrivacyIndicatorWrapper() {
  const { item } = useTableRowContext();

  if (!item.privacy) return null;

  return (
      <PrivacyIndicator
        privacyLevel={item.privacy}
        resourceType={item.type}
        spaceName={item.space?.name || ""}
        iconSize={16}
        className="ml-2"
      />
  );
}
