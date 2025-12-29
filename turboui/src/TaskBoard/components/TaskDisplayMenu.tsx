import React from "react";
import { Menu } from "../../Menu";
import { IconAdjustmentsHorizontal, IconLayoutKanban, IconList } from "../../icons";
import classNames from "../../utils/classnames";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Types from "../types";

interface Props {
  mode: Types.TaskDisplayMode;
  onChange: (mode: Types.TaskDisplayMode) => void;
}

export function TaskDisplayMenu({ mode, onChange }: Props) {
  return (
    <Menu
      customTrigger={
        <button
          className="inline-flex items-center gap-1 py-1.5 px-2 rounded-md text-sm font-medium text-content-dimmed hover:text-content-base hover:bg-surface-dimmed transition"
          aria-label="Display options"
          data-test-id="display-menu-trigger"
          type="button"
        >
          <IconAdjustmentsHorizontal size={18} />
          <span>Display</span>
        </button>
      }
      size="tiny"
      align="end"
    >
      <div className="p-2" data-test-id="display-menu">
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
    </Menu>
  );
}