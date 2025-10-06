import React from "react";
import { match } from "ts-pattern";
import WorkMap from "..";
import { SecondaryButton } from "../../../Button";
import { IconChevronDown, IconChevronRight, IconGoal, IconProject } from "../../../icons";
import { BlackLink } from "../../../Link";
import { PrivacyIndicator } from "../../../PrivacyIndicator";
import { SpaceField } from "../../../SpaceField";
import { createTestId } from "../../../TestableElement";
import classNames from "../../../utils/classnames";
import { useItemStatus } from "../../hooks/useItemStatus";
import { AddItemModal } from "../AddItemModal";

interface Props {
  item: WorkMap.Item;
  level: number;
  showIndentation: boolean;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  canAddChildren: boolean;
  addingEnabled?: boolean;
  addItem?: WorkMap.AddNewItemFn;
  spaceSearch?: SpaceField.SearchSpaceFn;
}

export function ItemNameCell({
  item,
  level,
  expanded,
  setExpanded,
  showIndentation,
  canAddChildren,
  addItem,
  spaceSearch,
}: Props) {
  return (
    <td className="py-2 px-2 md:px-4 relative" data-test-id={createTestId("work-item", item.name)}>
      <div className="flex items-center">
        <Indentation level={level} showIndentation={showIndentation} />
        <ExpandButton item={item} expanded={expanded} setExpanded={setExpanded} showIndentation={showIndentation} />
        <Icon item={item} />
        <Name item={item} />
        <PrivacyIndicatorWrapper item={item} />

        {canAddChildren && <AddButton item={item} addItem={addItem!} spaceSearch={spaceSearch!} />}
      </div>
    </td>
  );
}

function Name({ item }: { item: WorkMap.Item }) {
  const { isCompleted, isFailed, isPending } = useItemStatus(item.status);
  const isClosed = isCompleted || isFailed;

  const textStyle = classNames(
    "font-medium text-xs md:text-sm transition-colors",
    {
      "text-content-dimmed dark:text-gray-400": isPending,
    },
    isClosed ? "text-content-dimmed dark:text-gray-400" : "text-content-base hover:text-link-hover",
  );

  // Determine the base text decoration style
  const textDecoration = isClosed ? "line-through" : "none";

  return (
    <div className="flex items-center">
      <BlackLink
        to={item.itemPath || ""}
        className={textStyle}
        style={{
          textDecoration,
          textDecorationThickness: ".5px",
        }}
        onMouseOver={(e) => {
          // On hover, add underline while keeping line-through
          if (isClosed) {
            e.currentTarget.style.textDecoration = "underline line-through";
          } else {
            e.currentTarget.style.textDecoration = "underline";
          }
        }}
        onMouseOut={(e) => {
          // On mouse out, restore original decoration
          e.currentTarget.style.textDecoration = textDecoration;
        }}
      >
        {item.name}
      </BlackLink>
    </div>
  );
}

function Icon({ item }: { item: WorkMap.Item }) {
  return match(item.type)
    .with("goal", () => <IconGoal size={20} className="mr-2" />)
    .with("project", () => <IconProject size={20} className="mr-2" />)
    .run();
}

function Indentation(props: { level: number; showIndentation: boolean }) {
  const indentPadding = props.showIndentation ? props.level * 20 : 0;

  if (!props.showIndentation) return null;

  return <div style={{ width: `${indentPadding}px` }} className="flex-shrink-0" data-testid="indentation" />;
}

function ExpandButton({ item, expanded, setExpanded, showIndentation }) {
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const testId = createTestId("chevron-icon", item.name);

  const handleExpandToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  if (!showIndentation) return null;

  if (!hasChildren) return <div className="w-[16px] sm:w-[24px]"></div>;

  return (
    <button
      onClick={handleExpandToggle}
      className="mr-2 text-content-dimmed hover:text-content-base dark:text-gray-400 dark:hover:text-gray-300"
      data-test-id={testId}
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

function AddButton({
  item,
  addItem,
  spaceSearch,
}: {
  item: WorkMap.Item;
  addItem: WorkMap.AddNewItemFn;
  spaceSearch: SpaceField.SearchSpaceFn;
}) {
  if (item.type !== "goal") return null;

  const [isOpen, setIsOpen] = React.useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <div className="-mt-[2px] ml-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
      <SecondaryButton size="xxs" onClick={open} testId="add-subitem">
        Add
      </SecondaryButton>

      <AddItemModal
        isOpen={isOpen}
        close={close}
        parentGoal={item}
        spaceSearch={spaceSearch}
        save={addItem}
        space={item.space}
      />
    </div>
  );
}
