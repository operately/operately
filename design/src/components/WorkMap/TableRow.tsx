import React, { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import {
  IconTargetArrow,
  IconChecklist,
  IconChevronDown,
  IconChevronRight,
} from "./Icons";
import { HoverQuickEntryWidget } from "./HoverQuickEntryWidget.tsx";
import type {
  WorkMapItem,
  GoalStatus,
  TableRowProps,
} from "../../types/workmap";

/**
 * TableRow component for rendering a WorkMap item (goal or project) in a table
 * Handles recursive rendering of children, styling for different item states,
 * and interactions like hover, selection, and adding new items
 */
export function TableRow({
  item,
  level,
  isLast,
  filter,
  isSelected = false,
  onRowClick,
  selectedItemId,
}: TableRowProps): React.ReactElement {
  // Determine if we're on the completed page for compact styling
  const isCompletedPage = filter === "completed";
  const [expanded, setExpanded] = useState<boolean>(true);
  const [showAddButton, setShowAddButton] = useState<boolean>(false);
  const [showQuickEntryWidget, setShowQuickEntryWidget] =
    useState<boolean>(false);
  const hasChildren = item.children && item.children.length > 0;

  // Decide whether to show indentation and controls
  // Only apply indentation on hierarchical pages (all work, goals)
  const showIndentation = !filter || filter === "goals" || filter === "all";
  const indentPadding = showIndentation ? level * 20 : 0;
  const isGoal = item.type === "goal";
  const isProject = item.type === "project";

  // Determine if item should have strikethrough or other special styling
  // Based on the three-state goal completion model: achieved, partial, missed
  const isCompleted =
    item.status === "completed" ||
    item.status === "achieved" ||
    item.status === "partial" ||
    item.status === "missed";
  const isFailed = item.status === "missed";
  const isDropped = item.status === "dropped";
  const isPending = item.status === "pending";

  // Handle click on the row to trigger selection
  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>): void => {
    // Prevent click from bubbling when clicking links or buttons
    const target = e.target as HTMLElement;
    if (
      target.tagName.toLowerCase() === "a" ||
      target.tagName.toLowerCase() === "button" ||
      target.closest("a") ||
      target.closest("button")
    ) {
      return;
    }

    // Call the selection handler
    if (onRowClick) {
      onRowClick(item);
    }
  };

  // Determine if this item is selected
  const isThisItemSelected =
    isSelected || (selectedItemId && selectedItemId === item.id);

  return (
    <>
      <tr
        data-workmap-selectable="true"
        className={`group border-b border-stroke-base transition-all duration-150 ease-in-out cursor-pointer relative
          ${item.isNew ? "bg-amber-50/70 dark:bg-amber-900/20" : ""}
          ${
            isThisItemSelected
              ? "bg-surface-highlight dark:bg-surface-dimmed/30"
              : "hover:bg-surface-highlight dark:hover:bg-surface-dimmed/20"
          }`}
        onClick={handleRowClick}
        onMouseEnter={() => setShowAddButton(true)}
        onMouseLeave={() => setShowAddButton(false)}
      >
        {/* Name */}
        <td className="py-2 px-2 md:px-4 relative">
          <div className="flex items-center">
            {/* Only show indentation and controls on hierarchical pages */}
            {showIndentation && (
              <>
                <div
                  style={{ width: `${indentPadding}px` }}
                  className="flex-shrink-0"
                ></div>

                {hasChildren && (
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setExpanded(!expanded);
                    }}
                    className="mr-2 text-content-dimmed hover:text-content-base dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {/* Use responsive size for chevron icons - smaller on mobile */}
                    <div className="hidden sm:block">
                      {expanded ? (
                        <IconChevronDown size={16} />
                      ) : (
                        <IconChevronRight size={16} />
                      )}
                    </div>
                    <div className="sm:hidden">
                      {expanded ? (
                        <IconChevronDown size={12} />
                      ) : (
                        <IconChevronRight size={12} />
                      )}
                    </div>
                  </button>
                )}

                {!hasChildren && <div className="w-[16px] sm:w-[24px]"></div>}
              </>
            )}

            <div
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                isGoal
                  ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
                  : "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
              }`}
            >
              {isGoal && <IconTargetArrow size={12} />}
              {isProject && <IconChecklist size={12} />}
            </div>

            <div className="flex items-center">
              <a
                href="#"
                className={`
                  font-medium text-xs md:text-sm hover:underline transition-colors
                  ${isCompleted || isFailed ? "line-through" : ""}
                  ${isDropped ? "line-through opacity-70" : ""}
                  ${isPending ? "text-content-dimmed dark:text-gray-400" : ""}
                  ${
                    filter === "completed" &&
                    (isCompleted || isFailed || isDropped)
                      ? "text-content-dimmed dark:text-gray-400"
                      : isCompleted || isFailed || isDropped
                      ? "text-content-dimmed dark:text-gray-400"
                      : "text-content-base dark:text-gray-200 hover:text-link-hover dark:hover:text-white"
                  }
                `}
              >
                {item.name}
              </a>
            </div>
          </div>

          {/* Action buttons container - contains both add and delete buttons */}
          {showAddButton && !isCompletedPage && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center gap-2">
              {/* Add button for goals only */}
              {isGoal && !showQuickEntryWidget && (
                <button
                  className="flex items-center gap-1 text-xs font-semibold border border-surface-outline bg-surface-base text-content-dimmed hover:text-content-base hover:bg-surface-accent rounded-2xl pl-2 pr-3 py-[1px] transition-colors shadow-sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setShowQuickEntryWidget(true);
                  }}
                  title="Add sub-item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14m-7-7h14" />
                  </svg>
                  <span>Add</span>
                </button>
              )}

              {/* Delete button for pending items */}
              {isPending && (
                <button
                  className="flex items-center p-1 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    // Dispatch a custom event to delete this item
                    const event = new CustomEvent("workmap:delete-item", {
                      detail: { itemId: item.id },
                    });
                    document.dispatchEvent(event);
                  }}
                  title="Delete pending item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </td>

        {/* Status */}
        <td className="py-2 px-2 md:px-4">
          <div className="transform group-hover:scale-105 transition-transform duration-150">
            <StatusBadge status={item.status} />
          </div>
        </td>

        {/* Progress bar - hidden on completed page and for completed items */}
        {filter !== "completed" && !isCompleted && (
          <td className="py-2 px-2 pr-6 lg:px-4">
            <div className="transform group-hover:scale-[1.02] transition-transform duration-150">
              <ProgressBar progress={item.progress} status={item.status} />
            </div>
          </td>
        )}
        {/* Empty cell for completed items on non-completed pages to maintain table structure */}
        {filter !== "completed" && isCompleted && (
          <td className="py-2 px-2 pr-4 md:px-4"></td>
        )}

        {/* Deadline or Completed On */}
        <td
          className={`py-2 px-2 md:px-4 ${
            filter === "completed" ? "" : "hidden lg:table-cell"
          }`}
        >
          {filter === "completed" && item.completedOn ? (
            <span className="text-xs sm:text-sm whitespace-nowrap text-content-base">
              {item.completedOn.display}
            </span>
          ) : (
            <span
              className={`
                text-sm whitespace-nowrap
                ${
                  item.deadline?.isPast &&
                  !isCompleted &&
                  !isFailed &&
                  !isDropped &&
                  !isPending
                    ? "text-red-600"
                    : "text-content-base"
                }
                ${
                  isCompleted || isFailed
                    ? "line-through text-content-dimmed"
                    : ""
                }
                ${
                  isDropped ? "line-through opacity-70 text-content-dimmed" : ""
                }
                ${isPending ? "text-content-dimmed" : ""}
              `}
            >
              {item.deadline?.display}
            </span>
          )}
        </td>

        {/* Space */}
        <td className="py-2 px-2 md:px-4 hidden lg:table-cell">
          <div className="w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
            <a
              href="#"
              title={item.space}
              className={`
                text-sm hover:underline
                ${
                  isCompleted || isFailed
                    ? "text-content-dimmed"
                    : "text-content-base hover:text-link-hover"
                }
                ${isDropped ? "opacity-70 text-content-dimmed" : ""}
                ${isPending ? "text-content-dimmed" : ""}
              `}
            >
              {item.space}
            </a>
          </div>
        </td>

        {/* Champion */}
        <td className="py-2  px-2 md:px-4 hidden xl:table-cell">
          <div className="flex items-center max-w-[120px] overflow-hidden">
            {/* Only show avatar/initials if there's an owner name */}
            {item.owner && item.owner.name && (
              <>
                {item.owner.avatar ? (
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-stroke-base mr-1.5 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-150 shadow-sm">
                    <img
                      src={item.owner.avatar}
                      alt={item.owner.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  item.owner.initials && (
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-1.5 text-xs flex-shrink-0 transform group-hover:scale-110 transition-transform duration-150 shadow-sm">
                      {item.owner.initials}
                    </div>
                  )
                )}
              </>
            )}
            <a
              href="#"
              title={item.owner.name}
              className={`
                text-sm truncate hover:underline transition-colors whitespace-nowrap overflow-hidden text-ellipsis inline-block
                ${
                  isCompleted || isFailed
                    ? "text-content-dimmed"
                    : "text-content-base hover:text-link-hover"
                }
                ${isDropped ? "opacity-70 text-content-dimmed" : ""}
                ${isPending ? "text-content-dimmed" : ""}
              `}
            >
              {item.owner.name}
            </a>
          </div>
        </td>

        {/* Next step - don't show on completed page */}
        {filter !== "completed" && (
          <td className="py-2 px-2 md:px-4 hidden xl:table-cell">
            <div className="w-full xl:max-w-[200px] 2xl:max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
              <span
                title={item.nextStep}
                className={`
                  text-sm transition-colors duration-150
                  ${
                    isCompleted || isFailed
                      ? "line-through text-content-dimmed"
                      : "text-content-base group-hover:text-content-intense"
                  }
                  ${
                    isDropped
                      ? "line-through opacity-70 text-content-dimmed"
                      : ""
                  }
                  ${isPending ? "text-content-dimmed" : ""}
                `}
              >
                {item.nextStep}
              </span>
            </div>
          </td>
        )}
      </tr>

      {/* Quick entry widget shown when add button is clicked as an overlay */}
      {showQuickEntryWidget && (
        <tr className="bg-transparent">
          <td colSpan={7} className="p-0">
            <div className="relative">
              {/* Mobile view - full width with proper padding */}
              <div className="block sm:hidden w-full px-2 pt-1 pb-2">
                <div className="bg-surface-base dark:bg-surface-dimmed shadow-lg border border-surface-outline rounded-md px-2 py-2 w-full">
                  <HoverQuickEntryWidget
                    parentItem={item}
                    onClose={() => setShowQuickEntryWidget(false)}
                  />
                </div>
              </div>

              {/* Desktop view - positioned with indent */}
              <div
                className="hidden sm:block absolute z-10 mt-1"
                style={{ marginLeft: `${indentPadding + 40}px` }}
              >
                <div className="bg-surface-base dark:bg-surface-dimmed shadow-lg border border-surface-outline rounded-md px-2 py-2 w-auto min-w-[400px]">
                  <HoverQuickEntryWidget
                    parentItem={item}
                    onClose={() => setShowQuickEntryWidget(false)}
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {expanded &&
        hasChildren &&
        item.children.map((child: WorkMapItem, index: number) => (
          <TableRow
            key={child.id}
            item={child}
            level={level + 1}
            isLast={index === item.children.length - 1 && isLast}
            filter={filter}
            selectedItemId={selectedItemId}
            onRowClick={onRowClick}
          />
        ))}
    </>
  );
}
