import { useTranslation } from "react-i18next";
import React from "react";
import { Menu, MenuRadioItem, SubMenu } from "../../Menu";
import { IconAdjustmentsHorizontal, IconLayoutKanban, IconList } from "../../icons";
import classNames from "../../utils/classnames";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Types from "../types";
import { SwitchToggle } from "../../SwitchToggle";
import type { ColumnColorsPreference } from "../columnColors";
import type { ColumnColorMode } from "../columnColors";
import { useWindowSizeBreakpoints } from "../../utils/useWindowSizeBreakpoint";
import type { TaskArchiveView } from "../KanbanView/types";

interface Props {
  archiveView?: TaskArchiveView;
  columnColors?: ColumnColorsPreference;
  mode?: Types.TaskDisplayMode;
  onChange?: (mode: Types.TaskDisplayMode) => void;
  closedStatuses?: {
    count: number;
    visible: boolean;
    onVisibilityChange: (visible: boolean) => void;
  };
}

export function TaskDisplayMenu({ mode, onChange, closedStatuses, columnColors, archiveView }: Props) {
  const { t } = useTranslation();
  const hasLayoutOptions = Boolean(mode && onChange);
  const hasClosedStatusesOption = Boolean(closedStatuses && closedStatuses.count > 0);
  const hasBoardOptions = hasClosedStatusesOption || (mode !== "list" && Boolean(archiveView || columnColors));

  return (
    <Menu
      customTrigger={
        <button
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-0 rounded-md px-2 py-1.5 text-sm font-medium text-content-dimmed transition hover:bg-surface-dimmed hover:text-content-base sm:min-h-0 sm:min-w-0 sm:gap-1"
          aria-label={t("Display options")}
          data-test-id="display-menu-trigger"
          type="button"
        >
          <IconAdjustmentsHorizontal size={18} />
          <span className="hidden sm:inline">{t("Display")}</span>
        </button>
      }
      size="small"
      align="end"
    >
      <div className="p-2" data-test-id="display-menu">
        {hasLayoutOptions && onChange && (
          <div>
            <div className="mb-2 px-1 text-xs font-medium text-content-subtle">{t("Layout")}</div>
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
                  <span className="text-sm font-semibold">{t("List")}</span>
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
                  <span className="text-sm font-semibold">{t("Board")}</span>
                </button>
              </DropdownMenu.Item>
            </div>
          </div>
        )}

        {hasBoardOptions && (
          <div className={classNames(hasLayoutOptions && "mt-3 border-t border-surface-outline pt-2")}>
            {hasClosedStatusesOption && closedStatuses && (
              <div className="flex items-center justify-between gap-3 px-3 py-1 text-sm font-medium leading-6 text-content-dimmed">
                <span>{t("Show closed statuses")}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-content-subtle">{closedStatuses.count}</span>
                  <SwitchToggle
                    label={t("Show closed statuses")}
                    labelHidden
                    value={closedStatuses.visible}
                    setValue={closedStatuses.onVisibilityChange}
                    testId="toggle-closed-statuses"
                  />
                </div>
              </div>
            )}

            {mode !== "list" && archiveView && <TaskViewMenu view={archiveView} />}

            {mode !== "list" && columnColors && <ColumnColorsMenu preference={columnColors} />}
          </div>
        )}
      </div>
    </Menu>
  );
}

function TaskViewMenu({ view }: { view: TaskArchiveView }) {
  const { t } = useTranslation();

  return (
    <DisplaySubMenu label={t("Tasks")} valueLabel={view.archived ? t("Archived tasks") : t("Active tasks")}>
      <DropdownMenu.RadioGroup
        value={view.archived ? "archived" : "active"}
        onValueChange={(value) => view.onChange(value === "archived")}
        aria-label={t("Tasks")}
      >
        <MenuRadioItem value="active" testId="active-tasks-view">
          {t("Active tasks")}
        </MenuRadioItem>
        <MenuRadioItem value="archived" testId="archived-tasks-view">
          {t("Archived tasks")}
        </MenuRadioItem>
      </DropdownMenu.RadioGroup>
    </DisplaySubMenu>
  );
}

function ColumnColorsMenu({ preference }: { preference: ColumnColorsPreference }) {
  const { t } = useTranslation();
  const options: { value: ColumnColorMode; label: string }[] = [
    { value: "vivid", label: t("Vivid", { context: "column colors" }) },
    { value: "soft", label: t("Soft", { context: "column colors" }) },
    { value: "bordered", label: t("Bordered", { context: "column colors" }) },
    { value: "none", label: t("None", { context: "column colors" }) },
  ];

  const choices = (
    <DropdownMenu.RadioGroup
      value={preference.value}
      onValueChange={(value) => {
        const option = options.find((option) => option.value === value);
        if (option) preference.onChange(option.value);
      }}
      aria-label={t("Column colors")}
    >
      {options.map((option) => (
        <MenuRadioItem key={option.value} value={option.value} testId={`column-colors-${option.value}`}>
          {option.label}
        </MenuRadioItem>
      ))}
    </DropdownMenu.RadioGroup>
  );

  return (
    <DisplaySubMenu
      label={t("Column colors")}
      valueLabel={options.find((option) => option.value === preference.value)?.label}
    >
      {choices}
    </DisplaySubMenu>
  );
}

function DisplaySubMenu({
  label,
  valueLabel,
  children,
}: React.PropsWithChildren<{ label: string; valueLabel?: string }>) {
  const isSmallScreen = useWindowSizeBreakpoints() === "xs";

  if (isSmallScreen) {
    return (
      <div className="py-1">
        <DropdownMenu.Label className="px-3 pb-1 text-xs font-medium text-content-subtle">{label}</DropdownMenu.Label>
        {children}
      </div>
    );
  }

  return (
    <SubMenu label={label} valueLabel={valueLabel}>
      {children}
    </SubMenu>
  );
}
