import React from "react";
import { useTranslation } from "react-i18next";
import type { WorkMapFilter, WorkMapFilterField, WorkMapFilterOperator } from "../ApiTypes";
import { CheckChoice, ChoiceGroup } from "./MenuChoices";
import { Item, RadioGroup, RadioItem } from "../Embedding/DropdownMenu";
import { Textfield } from "../FormElements/Textfield";
import { IconFilter } from "../icons";
import { Menu, MenuActionItem, MenuSeparator } from "../Menu";
import { formatNumber } from "../utils/formatting";
import { compareIds } from "../utils/ids";
import { referenceId, type WorkMapV2Item } from "./filterWorkMap";

function useFields(items: WorkMapV2Item[], spaceId?: string) {
  const { t } = useTranslation();

  const references = React.useMemo(() => {
    const space = new Map<string, string>(),
      champion = new Map<string, string>();
    function visit(items: WorkMapV2Item[]) {
      for (const item of items) {
        visit(item.children);
        if (spaceId && !compareIds(item.space?.id, spaceId)) continue;
        if (item.space) space.set(referenceId(item.space.id), item.space.name);
        if (item.owner) champion.set(referenceId(item.owner.id), item.owner.fullName);
      }
    }
    visit(items);
    return { space: Object.fromEntries(space), champion: Object.fromEntries(champion) };
  }, [items, spaceId]);

  const labels: Record<WorkMapFilterField, string> = {
    work_type: t("Work type"),
    lifecycle: t("Lifecycle"),
    name: t("Name"),
    goal_status: t("Goal status"),
    project_status: t("Project status"),
    space: t("Space"),
    champion: t("Champion"),
    due_date: t("Due date"),
    created_date: t("Created date"),
    completed_date: t("Completed date"),
  };
  const operators: Record<WorkMapFilterOperator, string> = {
    is: t("Is"),
    is_any_of: t("Is any of"),
    is_not: t("Is not"),
    contains: t("Contains"),
    does_not_contain: t("Does not contain"),
    before: t("Before"),
    after: t("After"),
  };
  const status = {
    on_track: t("On track"),
    caution: t("Caution"),
    off_track: t("Off track"),
    pending: t("Pending"),
    outdated: t("Outdated"),
  };
  const dates = {
    week_ago: t("1 week ago"),
    month_ago: t("1 month ago"),
    three_months_ago: t("3 months ago"),
    six_months_ago: t("6 months ago"),
    year_ago: t("1 year ago"),
  };
  const choices: Record<WorkMapFilterField, Record<string, string>> = {
    work_type: { goal: t("Goals"), project: t("Projects") },
    lifecycle: { active: t("Active"), paused: t("Paused"), closed: t("Completed") },
    name: {},
    goal_status: { ...status, achieved: t("Achieved"), missed: t("Missed") },
    project_status: { ...status, paused: t("Paused"), closed: t("Completed") },
    ...references,
    due_date: { past: t("In the past"), ...dates },
    created_date: dates,
    completed_date: dates,
  };

  return { labels, operators, choices };
}

export function FilterMenu({
  compact,
  items,
  spaceId,
  filters,
  onChange,
}: {
  compact: boolean;
  items: WorkMapV2Item[];
  spaceId?: string;
  filters: WorkMapFilter[];
  onChange: (filters: WorkMapFilter[]) => void;
}) {
  const { t, i18n } = useTranslation();
  const { labels, operators, choices } = useFields(items, spaceId);
  const [search, setSearch] = React.useState("");
  const trigger = React.useRef<HTMLButtonElement>(null);
  function edit(field: WorkMapFilterField) {
    const filter = filters.find((f) => f.field === field);
    return (
      <FilterEditor
        key={field}
        field={field}
        label={labels[field]}
        choices={choices[field]}
        operators={operators}
        filter={filter}
        onChange={(next) => {
          if (!next) onChange(filters.filter((f) => f.field !== field));
          else if (filter) onChange(filters.map((f) => (f.field === field ? next : f)));
          else onChange([...filters, next]);
        }}
      />
    );
  }
  function chip(f: WorkMapFilter) {
    const values = f.values
      .map((v) => choices[f.field][v] ?? (f.field === "champion" || f.field === "space" ? t("Unavailable") : v))
      .join(", ");
    if (f.field === "lifecycle" && f.values.length === 1 && f.operator !== "is_not") {
      if (f.values[0] === "active") return t("Active work");
      if (f.values[0] === "closed") return t("Completed work");
      if (f.values[0] === "paused") return t("Paused work");
    }
    if (f.field === "work_type" && f.operator !== "is_not") return values;
    return t("{{field}} {{operator}} {{values}}", { field: labels[f.field], operator: operators[f.operator], values });
  }

  return (
    <>
      <Menu
        triggerRef={trigger}
        triggerLabel={
          compact && filters.length ? `${t("Filter")} (${formatNumber(filters.length, i18n.language)})` : t("Filter")
        }
        triggerClassName={compact ? "ml-auto min-h-10 whitespace-nowrap" : undefined}
        triggerIcon={IconFilter}
        align="start"
        size="small"
        onOpenChange={(open) => {
          if (!open) setSearch("");
        }}
        headerContent={
          <MenuTextfield
            aria-label={t("Find a filter…")}
            placeholder={t("Find a filter…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={keepTyping}
          />
        }
      >
        <div>
          {(Object.keys(labels) as WorkMapFilterField[])
            .filter((field) => labels[field].toLowerCase().includes(search.toLowerCase()))
            .map((field) => (
              <ChoiceGroup key={field} label={labels[field]}>
                {edit(field)}
              </ChoiceGroup>
            ))}
        </div>
      </Menu>
      {!compact &&
        filters.map((f) => (
          <AppliedFilter key={f.field} label={chip(f)} filterButton={trigger}>
            {edit(f.field)}
          </AppliedFilter>
        ))}
    </>
  );
}

function AppliedFilter({
  label,
  filterButton,
  children,
}: React.PropsWithChildren<{
  label: string;
  filterButton: React.RefObject<HTMLButtonElement>;
}>) {
  const trigger = React.useRef<HTMLButtonElement>(null);
  return (
    <Menu
      triggerRef={trigger}
      align="start"
      size="small"
      triggerClassName="rounded-md border border-surface-outline bg-surface-accent px-2 py-1 text-xs"
      triggerLabel={label}
      onCloseAutoFocus={(e) => {
        if (!trigger.current) {
          e.preventDefault();
          filterButton.current?.focus();
        }
      }}
    >
      {children}
    </Menu>
  );
}

function MenuTextfield(props: React.ComponentProps<typeof Textfield>) {
  return (
    <Item asChild onSelect={(e) => e.preventDefault()}>
      <Textfield {...props} role="textbox" />
    </Item>
  );
}

function keepTyping(event: React.KeyboardEvent) {
  if (event.key.length === 1 || event.key === "ArrowLeft" || event.key === "ArrowRight") event.stopPropagation();
}

function FilterEditor({
  field,
  label,
  choices,
  operators,
  filter,
  onChange,
}: {
  field: WorkMapFilterField;
  label: string;
  choices: Record<string, string>;
  operators: Record<WorkMapFilterOperator, string>;
  filter?: WorkMapFilter;
  onChange: (next: WorkMapFilter | null) => void;
}) {
  const { t } = useTranslation();
  const date = field.endsWith("_date");
  const values = filter?.values ?? [];
  const available: WorkMapFilterOperator[] = date
    ? ["after", "before"]
    : field === "name"
      ? ["contains", "does_not_contain"]
      : [values.length > 1 ? "is_any_of" : "is", "is_not"];
  const [draft, setDraft] = React.useState<WorkMapFilterOperator>(available[0] ?? "is");
  const operator = filter?.operator ?? draft;
  function update(op: WorkMapFilterOperator, values: string[]) {
    if (!date && field !== "name" && op !== "is_not") op = values.length > 1 ? "is_any_of" : "is";
    setDraft(op);
    onChange(values.length ? { field, operator: op, values } : null);
  }
  return (
    <>
      <RadioGroup
        className="flex gap-1 px-2 py-1"
        aria-label={label}
        value={operator === "is_any_of" && values.length === 1 ? "is" : operator}
      >
        {available.map((op) => (
          <RadioItem
            key={op}
            value={op}
            className="cursor-pointer rounded px-2 py-1 text-xs data-[state=checked]:bg-surface-accent data-[state=checked]:font-semibold data-[highlighted]:outline"
            onSelect={(e) => {
              e.preventDefault();
              setDraft(op);
              if (values.length) update(op, values[0] === "past" && op === "after" ? [] : values);
            }}
          >
            {operators[op]}
          </RadioItem>
        ))}
      </RadioGroup>
      {field === "name" ? (
        <MenuTextfield
          className="px-2 py-1"
          aria-label={label}
          value={values[0] ?? ""}
          onKeyDown={keepTyping}
          onChange={(e) => update(operator, e.target.value ? [e.target.value] : [])}
        />
      ) : (
        Object.entries(choices).map(([value, text]) => (
          <CheckChoice
            key={value}
            label={text}
            checked={values.includes(value)}
            onChange={() => {
              if (values.includes(value))
                update(
                  operator,
                  values.filter((v) => v !== value),
                );
              else if (date) update(value === "past" ? "before" : operator, [value]);
              else update(operator, [...values, value]);
            }}
          />
        ))
      )}
      {date && (
        <MenuTextfield
          type="date"
          className="px-2 py-1"
          aria-label={t("Custom date")}
          value={values[0]?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? ""}
          onKeyDown={keepTyping}
          onChange={(e) => update(operator, e.target.value ? [e.target.value] : [])}
        />
      )}
      <MenuSeparator />
      <MenuActionItem disabled={!filter} onClick={() => onChange(null)}>
        {t("Clear filter")}
      </MenuActionItem>
    </>
  );
}
