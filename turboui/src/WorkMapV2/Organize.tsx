import React from "react";
import { useTranslation } from "react-i18next";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconGripVertical } from "../icons";
import type { WorkMapParentChange } from "../ApiTypes";
import { Table } from "./Table";
import { visibleRows, type VisibleRow, type WorkMapRow } from "./filterWorkMap";
import { move, moveDestination, type Placement, type OrganizationDraft } from "./organization";

export interface Organization {
  canReparent: (id: string) => boolean;
  save: (orderedItemIds: string[], parentChanges: WorkMapParentChange[]) => Promise<boolean>;
}

export function Organize({
  initialRows,
  columns,
  formattedTimePreferences,
  organization,
  onClose,
  space,
}: Pick<React.ComponentProps<typeof Table>, "columns" | "formattedTimePreferences"> & {
  initialRows: WorkMapRow[];
  organization: Organization;
  onClose: () => void;
  space: boolean;
}) {
  const { t } = useTranslation();
  const [original] = React.useState<OrganizationDraft>(() => ({ rows: initialRows, parentChanges: [] }));
  const [draft, setDraft] = React.useState(original);
  const [collapsed, setCollapsed] = React.useState(new Set<string>());
  const [saving, setSaving] = React.useState(false);
  const [dragged, setDragged] = React.useState<string | null>(null);
  const [drop, setDrop] = React.useState<{ id: string; placement: Placement } | null>(null);
  const all = React.useMemo(() => visibleRows(draft.rows, new Set()), [draft.rows]);

  function apply(id: string, target: string, placement: Placement) {
    setDraft((current) => move(current, id, target, placement, organization.canReparent(id)));
    if (placement === "inside") setCollapsed((prev) => new Set([...prev].filter((key) => key !== target)));
  }
  async function save() {
    setSaving(true);
    try {
      if (
        await organization.save(
          all.filter((r) => !r.contextOnly).map((r) => r.item.id),
          draft.parentChanges,
        )
      )
        onClose();
    } finally {
      setSaving(false);
    }
  }

  function controls(row: VisibleRow) {
    if (row.contextOnly || saving) return null;
    const id = row.item.id;
    return (
      <span
        aria-hidden
        data-test-id={`drag-${id}`}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", id);
          event.dataTransfer.effectAllowed = "move";
          setDragged(id);
        }}
        onDragEnd={() => {
          setDragged(null);
          setDrop(null);
        }}
        className="cursor-grab text-content-subtle"
      >
        <IconGripVertical size={15} />
      </span>
    );
  }

  function placementFor(event: React.DragEvent, row: VisibleRow): Placement {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientY - rect.top) / rect.height;

    if (row.item.type === "goal" && fraction > 0.25 && fraction < 0.75) return "inside";
    return fraction < 0.5 ? "before" : "after";
  }

  function rowProps(row: VisibleRow): React.HTMLAttributes<HTMLTableRowElement> {
    if (saving || !dragged || dragged === row.item.id) return {};

    return {
      style:
        drop?.id === row.item.id
          ? {
              boxShadow:
                drop.placement === "inside"
                  ? "inset 0 0 0 2px var(--color-brand-1)"
                  : `inset 0 ${drop.placement === "before" ? 2 : -2}px var(--color-brand-1)`,
            }
          : undefined,
      onDragOver: (event) => {
        const placement = placementFor(event, row);
        if (!moveDestination(draft, dragged, row.item.id, placement, organization.canReparent(dragged))) {
          setDrop(null);
          return;
        }
        event.preventDefault();
        if (drop?.id !== row.item.id || drop.placement !== placement) setDrop({ id: row.item.id, placement });
      },
      onDrop: (event) => {
        event.preventDefault();
        apply(dragged, row.item.id, placementFor(event, row));
        setDrop(null);
        setDragged(null);
      },
    };
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-y border-surface-outline px-7 py-3">
        <strong>{t("Organize Work Map")}</strong>
        <span className="text-sm text-content-dimmed">
          {t("Drag to reorder. Drop on a goal to change its parent.")}
        </span>
        <SecondaryButton testId="cancel-organize" className="ml-auto" size="xs" disabled={saving} onClick={onClose}>
          {t("Cancel")}
        </SecondaryButton>
        <PrimaryButton size="xs" testId="save-map-order" disabled={draft === original} loading={saving} onClick={save}>
          {t("Save order")}
        </PrimaryButton>
      </div>

      <Table
        rows={visibleRows(draft.rows, collapsed)}
        columns={columns}
        formattedTimePreferences={formattedTimePreferences}
        onToggle={(id) =>
          setCollapsed((prev) => {
            const next = new Set(prev);
            if (!next.delete(id)) next.add(id);
            return next;
          })
        }
        organize={{ controls, rowProps }}
      />

      <footer className="px-7 py-4 text-xs text-content-dimmed">
        {space ? t("Shared space order") : t("Shared company order")}
      </footer>
    </>
  );
}
