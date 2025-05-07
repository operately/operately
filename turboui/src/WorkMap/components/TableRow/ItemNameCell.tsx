import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { BlackLink } from "../../../Link";
import classNames from "../../../utils/classnames";
import { useItemStatus } from "../../hooks/useItemStatus";
import { IconGoal, IconProject } from "../../../icons";
import { PrivacyIndicator } from "../../../PrivacyIndicator";
import { match } from "ts-pattern";
import WorkMap from "..";

interface Props {
  item: WorkMap.Item;
  filter: WorkMap.Filter;
  level: number;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ItemNameCell({ item, filter, level, expanded, setExpanded }: Props) {
  return (
    <td className="py-2 px-2 md:px-4 relative">
      <div className="flex items-center">
        <Indentation filter={filter} level={level} />
        <ExpandButton item={item} expanded={expanded} setExpanded={setExpanded} filter={filter} />
        <Icon item={item} />
        <Name item={item} />
        <PrivacyIndicatorWrapper item={item} />
      </div>
    </td>
  );
}

function Name({ item }: { item: WorkMap.Item }) {
  const { isCompleted, isFailed, isDropped, isPending } = useItemStatus(item.status);

  const textStyle = classNames(
    "flex items-center",
    "font-medium text-xs md:text-sm hover:underline transition-colors",
    {
      "line-through": isCompleted || isFailed,
      "line-through opacity-70": isDropped,
      "text-content-dimmed dark:text-gray-400": isPending,
    },
    isCompleted || isFailed || isDropped
      ? "text-content-dimmed dark:text-gray-400"
      : "text-content-base hover:text-content-dimmed",
  );

  return <div className={textStyle}>{item.name}</div>;
}

function Icon({ item }: { item: WorkMap.Item }) {
  return match(item.type)
    .with("goal", () => <IconGoal size={20} className="mr-2" />)
    .with("project", () => <IconProject size={20} className="mr-2" />)
    .run();
}

function Indentation({ filter, level }: { filter: WorkMap.Filter; level: number }) {
  const showIndentation = !filter || filter === "goals" || filter === "all";
  const indentPadding = showIndentation ? level * 20 : 0;

  if (!showIndentation) return null;

  return <div style={{ width: `${indentPadding}px` }} className="flex-shrink-0" data-testid="indentation" />;
}

function ExpandButton({ item, expanded, setExpanded, filter }) {
  const hasChildren = Boolean(item.children && item.children.length > 0);

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
      data-testid="chevron-icon"
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

function PrivacyIndicatorWrapper({ item }: { item: WorkMap.Item }) {
  if (!item.privacy) return null;

  return (
    <PrivacyIndicator
      privacyLevel={item.privacy}
      resourceType={item.type}
      spaceName={item.space?.name || ""}
      iconSize={16}
      className="ml-2"
      testId="privacy-indicator"
    />
  );
}
