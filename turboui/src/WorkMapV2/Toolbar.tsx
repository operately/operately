import React from "react";
import { useTranslation } from "react-i18next";
import { SecondaryButton } from "../Button";
import { CheckboxItem, Group, ItemIndicator, Label } from "../Embedding/DropdownMenu";
import { IconAdjustmentsHorizontal, IconCheck, IconFilter, IconGripVertical, IconTable, IconTimeline } from "../icons";
import { Menu, MenuActionItem, MenuSeparator, SubMenu } from "../Menu";
import { useWindowSizeBreakpoints } from "../utils/useWindowSizeBreakpoint";
import { ViewToggle } from "../ViewToggle";
import { defaultWorkMapV2Filters, type WorkMapV2Filters } from "./filterWorkMap";

const chipClassName = "rounded-md border border-surface-outline bg-surface-accent px-2 py-1 text-xs";

interface Props {
  filters: WorkMapV2Filters;
  onFiltersChange: (filters: WorkMapV2Filters) => void;
}

export function Toolbar({ filters, onFiltersChange }: Props) {
  const { t } = useTranslation();
  const compact = useWindowSizeBreakpoints() === "xs";
  const filterButton = React.useRef<HTMLButtonElement>(null);
  const workTypes = [
    { value: "goal", label: t("Goals") },
    { value: "project", label: t("Projects") },
  ] as const;
  const lifecycle = [
    { value: "active", label: t("Active"), chip: t("Active work") },
    { value: "paused", label: t("Paused"), chip: t("Paused work") },
    { value: "closed", label: t("Completed"), chip: t("Completed work") },
  ] as const;
  const typeChoices = (
    <Choices
      options={workTypes}
      selected={filters.workTypes}
      onChange={(workTypes) => onFiltersChange({ ...filters, workTypes })}
    />
  );
  const lifecycleChoices = (
    <Choices
      options={lifecycle}
      selected={filters.lifecycle}
      onChange={(lifecycle) => onFiltersChange({ ...filters, lifecycle })}
    />
  );
  const isDefault = !filters.workTypes.length && filters.lifecycle.length === 1 && filters.lifecycle[0] === "active";

  return (
    <div className="flex min-h-14 flex-wrap items-center gap-2 border-y border-surface-outline px-4 py-2 sm:px-7">
      <ViewToggle
        value="table"
        ariaLabel={t("Work map view")}
        options={[
          { value: "table", label: t("Table"), icon: <IconTable size={14} />, disabled: true },
          { value: "timeline", label: t("Timeline"), icon: <IconTimeline size={14} />, disabled: true },
        ]}
      />
      <span aria-hidden className="mx-1 h-5 border-l border-surface-outline" />
      <Menu triggerRef={filterButton} triggerIcon={IconFilter} triggerLabel={t("Filter")} align="start" size="tiny">
        <FilterGroup label={t("Work type")} compact={compact}>
          {typeChoices}
        </FilterGroup>
        {compact && <MenuSeparator />}
        <FilterGroup label={t("Lifecycle")} compact={compact}>
          {lifecycleChoices}
        </FilterGroup>
      </Menu>
      <AppliedFilter
        labels={workTypes.filter((o) => filters.workTypes.includes(o.value)).map((o) => o.label)}
        filterButton={filterButton}
      >
        {typeChoices}
      </AppliedFilter>
      <AppliedFilter
        labels={lifecycle.filter((o) => filters.lifecycle.includes(o.value)).map((o) => o.chip)}
        filterButton={filterButton}
      >
        {lifecycleChoices}
      </AppliedFilter>
      <div className="ml-auto flex items-center gap-2">
        {!isDefault && (
          <SecondaryButton size="xs" onClick={() => onFiltersChange(defaultWorkMapV2Filters)}>
            {t("Reset view")}
          </SecondaryButton>
        )}
        <SecondaryButton size="xs" disabled icon={IconAdjustmentsHorizontal}>
          {t("Display")}
        </SecondaryButton>
        <SecondaryButton size="xs" disabled icon={IconGripVertical}>
          {t("Organize")}
        </SecondaryButton>
      </div>
    </div>
  );
}

function FilterGroup({ label, compact, children }: React.PropsWithChildren<{ label: string; compact: boolean }>) {
  if (!compact) return <SubMenu label={label}>{children}</SubMenu>;

  return (
    <Group aria-label={label}>
      <Label className="px-3 text-sm font-semibold">{label}</Label>
      {children}
    </Group>
  );
}

function AppliedFilter({
  labels,
  filterButton,
  children,
}: React.PropsWithChildren<{
  labels: string[];
  filterButton: React.RefObject<HTMLButtonElement>;
}>) {
  const trigger = React.useRef<HTMLButtonElement>(null);
  if (!labels.length) return null;

  return (
    <Menu
      triggerLabel={labels.join(", ")}
      triggerClassName={chipClassName}
      triggerRef={trigger}
      align="start"
      size="tiny"
      onCloseAutoFocus={(event) => {
        if (!trigger.current) {
          event.preventDefault();
          filterButton.current?.focus();
        }
      }}
    >
      {children}
    </Menu>
  );
}

function Choices<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="px-3 pb-2 text-xs text-content-dimmed">{t("Is any of")}</div>
      {options.map(({ value, label }) => (
        <CheckboxItem
          key={value}
          checked={selected.includes(value)}
          className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface-highlight"
          onSelect={(e) => e.preventDefault()}
          onCheckedChange={(checked) => onChange(checked ? [...selected, value] : selected.filter((v) => v !== value))}
        >
          {label}
          <ItemIndicator>
            <IconCheck size={15} />
          </ItemIndicator>
        </CheckboxItem>
      ))}
      <MenuSeparator />
      <MenuActionItem disabled={!selected.length} onClick={() => onChange([])}>
        {t("Clear filter")}
      </MenuActionItem>
    </>
  );
}
