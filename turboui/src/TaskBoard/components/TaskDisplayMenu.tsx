import React from "react";
import { Menu } from "../../Menu";
import { IconAdjustmentsHorizontal, IconLayoutKanban, IconList } from "../../icons";
import classNames from "../../utils/classnames";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Types from "../types";
import { SwitchToggle } from "../../SwitchToggle";

interface Props {
  mode?: Types.TaskDisplayMode;
  onChange?: (mode: Types.TaskDisplayMode) => void;
  closedStatuses?: {
    count: number;
    visible: boolean;
    onVisibilityChange: (visible: boolean) => void;
  };
}

export function TaskDisplayMenu({ mode, onChange, closedStatuses }: Props) {
  const hasLayoutOptions = Boolean(mode && onChange);
  const hasClosedStatusesOption = Boolean(closedStatuses && closedStatuses.count > 0);

  return (
    <Menu
      customTrigger={
        <button
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-0 rounded-md px-2 py-1.5 text-sm font-medium text-content-dimmed transition hover:bg-surface-dimmed hover:text-content-base sm:min-h-0 sm:min-w-0 sm:gap-1"
          aria-label="Display options"
          data-test-id="display-menu-trigger"
          type="button"
        >
          <IconAdjustmentsHorizontal size={18} />
          <span className="hidden sm:inline">Display</span>
        </button>
      }
      size="small"
      align="end"
    >
      <div className="p-2" data-test-id="display-menu">
        {hasLayoutOptions && onChange && (
          <div>
            <div className="mb-2 px-1 text-xs font-medium text-content-subtle">Layout</div>
            <div className="grid grid-cols-2 gap-2">
              <DropdownMenu.Item asChild>
                <button
                  type="button"
                  className={classNames(
                    "flex flex-col items-center gap-1 px-4 py-3 rounded-md border border-surface-outline transition focus:outline-none",
                    mode === "list"
                      ? "bg-surface-highlight text-content-base"
                      : "text-content-dimmed hover:bg-surface-dimmed",
                  )}
                  onClick={() => onChange("list")}
                  aria-pressed={mode === "list"}
                  data-test-id="display-menu-option-list"
                >
                  <IconList size={20} />
                  <span className="text-sm font-semibold">List</span>
                </button>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <button
                  type="button"
                  className={classNames(
                    "flex flex-col items-center gap-1 px-4 py-3 rounded-md border border-surface-outline transition focus:outline-none",
                    mode === "board"
                      ? "bg-surface-highlight text-content-base"
                      : "text-content-dimmed hover:bg-surface-dimmed",
                  )}
                  onClick={() => onChange("board")}
                  aria-pressed={mode === "board"}
                  data-test-id="display-menu-option-board"
                >
                  <IconLayoutKanban size={20} />
                  <span className="text-sm font-semibold">Board</span>
                </button>
              </DropdownMenu.Item>
            </div>
          </div>
        )}

        {hasClosedStatusesOption && closedStatuses && (
          <div
            className={classNames(
              "flex items-center justify-between gap-3 px-1 py-2",
              hasLayoutOptions && "mt-3 border-t border-surface-outline pt-3",
            )}
          >
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-content-base">
              <span>Show closed statuses</span>
              <span className="rounded-full border border-surface-outline px-1.5 py-0.5 text-xs tabular-nums text-content-dimmed">
                {closedStatuses.count}
              </span>
            </div>
            <SwitchToggle
              label="Show closed statuses"
              labelHidden
              value={closedStatuses.visible}
              setValue={closedStatuses.onVisibilityChange}
              testId="toggle-closed-statuses"
            />
          </div>
        )}
      </div>
    </Menu>
  );
}
