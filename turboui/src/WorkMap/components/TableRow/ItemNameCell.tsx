import React from "react";
import { match } from "ts-pattern";
import WorkMap from "..";
import { SecondaryButton } from "../../../Button";
import { GoalAddForm, GoalAddModal } from "../../../GoalAddForm";
import { IconChevronDown, IconChevronRight, IconGoal, IconProject } from "../../../icons";
import { BlackLink } from "../../../Link";
import Modal from "../../../Modal";
import { PrivacyIndicator } from "../../../PrivacyIndicator";
import classNames from "../../../utils/classnames";
import { useItemStatus } from "../../hooks/useItemStatus";

interface Props {
  item: WorkMap.Item;
  level: number;
  showIndentation: boolean;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  canAddChildren: boolean;
}

export function ItemNameCell({ item, level, expanded, setExpanded, showIndentation, canAddChildren }: Props) {
  return (
    <td className="py-2 px-2 md:px-4 relative">
      <div className="flex items-center">
        <Indentation level={level} showIndentation={showIndentation} />
        <ExpandButton item={item} expanded={expanded} setExpanded={setExpanded} showIndentation={showIndentation} />
        <Icon item={item} />
        <Name item={item} />
        <PrivacyIndicatorWrapper item={item} />

        {canAddChildren && <AddButton item={item} />}
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

function AddButton({ item }: { item: WorkMap.Item }) {
  if (item.type !== "goal") return null;

  const [isOpen, setIsOpen] = React.useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const spaceSearch = ({}: { query: string }) => {
    // Implement space search logic here
    return Promise.resolve([]); // Replace with actual search results
  };

  const save = (_attrs: GoalAddForm.SaveProps): Promise<{ id: string }> => {
    // Implement save logic here
    return Promise.resolve({ id: "new-goal-id" }); // Replace with actual save logic
  };

  return (
    <div className="-mt-[2px] ml-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
      <SecondaryButton size="xxs" onClick={open}>
        Add
      </SecondaryButton>

      <AddSubitemModal isOpen={isOpen} close={close} spaceSearch={spaceSearch} save={save} parentGoal={item} />
    </div>
  );
}

function AddSubitemModal(props: GoalAddModal.Props & { parentGoal: WorkMap.Item }) {
  const [itemType, setItemType] = React.useState<"goal" | "project">("project");

  return (
    <Modal isOpen={props.isOpen} onClose={props.close} size="medium" closeOnBackdropClick={false}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-bold text-xl">{itemType === "goal" ? "Add New Sub-goal" : "Add New Project"}</h1>
        </div>

        <Toggle
          value={itemType}
          setValue={(v) => setItemType(v)}
          options={[
            { label: "Goal", value: "goal" },
            { label: "Project", value: "project" },
          ]}
        />
      </div>

      <GoalAddForm hideTitle={true} {...props} />
    </Modal>
  );
}

function Toggle<T extends string>({
  value,
  setValue,
  options,
}: {
  value: T;
  setValue: (value: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="flex bg-surface-dimmed rounded p-0.5 border border-stroke-base">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={classNames(
            "px-2 py-0.5 rounded text-sm font-medium transition-colors",
            value === option.value ? "bg-brand-1 text-white-1" : "bg-transparent",
          )}
          onClick={() => setValue(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
