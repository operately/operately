import type { WorkMapParentChange } from "../ApiTypes";
import type { WorkMapRow } from "./filterWorkMap";

export interface OrganizationDraft {
  rows: WorkMapRow[];
  parentChanges: WorkMapParentChange[];
}

export type Placement = "before" | "after" | "inside";

// Keep the full tree in the draft so saving preserves closed items' order and parent relationships.
export function openRows(rows: WorkMapRow[]): WorkMapRow[] {
  return rows.flatMap((row) => {
    const children = openRows(row.children);
    if (row.item.state === "closed") return children;
    if (row.contextOnly && children.length === 0) return [];
    return [{ ...row, children }];
  });
}

function locate(
  rows: WorkMapRow[],
  id: string,
  parent: WorkMapRow | null = null,
): { row: WorkMapRow; parent: WorkMapRow | null } | undefined {
  for (const row of rows) {
    if (row.item.id === id) return { row, parent };
    const child = locate(row.children, id, row);
    if (child) return child;
  }
  return undefined;
}

export function moveDestination(
  draft: OrganizationDraft,
  id: string,
  targetId: string | null,
  placement: Placement,
  canReparent: boolean,
) {
  const source = locate(draft.rows, id);
  if (!source || source.row.contextOnly || targetId === id) return null;
  if (targetId === null) {
    return canReparent && source.parent ? { row: source.row, parentId: null, changedParent: true } : null;
  }

  const target = locate(draft.rows, targetId);
  if (!target) return null;
  // A context row at the top level can serve as a drop target for detaching a child.
  if (target.row.contextOnly && (placement === "inside" || target.parent || !source.parent)) return null;
  if (placement === "inside" && target.row.item.type !== "goal") return null;

  const parent = placement === "inside" ? target.row : target.parent;
  const parentId = parent?.item.id ?? null;
  const changedParent = parent !== source.parent;

  // A promoted row can appear next to work with a different real parent.
  if (changedParent && placement !== "inside" && source.parent?.item.state === "closed") return null;
  if (changedParent && (!canReparent || (parentId && (parentId === id || locate(source.row.children, parentId)))))
    return null;
  if (changedParent && (parent?.contextOnly || parent?.item.state === "closed")) return null;
  if (!changedParent && placement === "inside") return null;

  return { row: source.row, parentId, changedParent };
}

export function move(
  draft: OrganizationDraft,
  id: string,
  targetId: string | null,
  placement: Placement,
  canReparent: boolean,
) {
  const destination = moveDestination(draft, id, targetId, placement, canReparent);
  if (!destination) return draft;

  const { row, parentId, changedParent } = destination;
  const movedRow = changedParent ? { ...row, item: { ...row.item, parentId } } : row;
  function update(siblings: WorkMapRow[], parent: string | null): WorkMapRow[] {
    const next = siblings
      .filter((r) => r.item.id !== id)
      .map((r) => ({
        ...r,
        children: update(r.children, r.item.id),
      }));
    if (parent === parentId) {
      const at = next.findIndex((r) => r.item.id === targetId);
      next.splice(at < 0 ? next.length : at + Number(placement === "after"), 0, movedRow);
    }
    return next;
  }

  const change = { type: row.item.type, itemId: id, parentId };
  return {
    rows: update(draft.rows, null),
    parentChanges: changedParent ? [...draft.parentChanges, change] : draft.parentChanges,
  };
}
