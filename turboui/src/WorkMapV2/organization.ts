import type { WorkMapParentChange } from "../ApiTypes";
import type { WorkMapRow } from "./filterWorkMap";

export interface OrganizationDraft {
  rows: WorkMapRow[];
  parentChanges: WorkMapParentChange[];
}

export type Placement = "before" | "after" | "inside";

function locate(
  rows: WorkMapRow[],
  id: string,
  parentId: string | null = null,
): { row: WorkMapRow; parentId: string | null } | undefined {
  for (const row of rows) {
    if (row.item.id === id) return { row, parentId };
    const child = locate(row.children, id, row.item.id);
    if (child) return child;
  }
  return undefined;
}

export function moveDestination(
  draft: OrganizationDraft,
  id: string,
  targetId: string,
  placement: Placement,
  canReparent: boolean,
) {
  const source = locate(draft.rows, id);
  if (!source || source.row.contextOnly || targetId === id) return null;
  const target = locate(draft.rows, targetId);
  if (!target) return null;
  // A context row at the top level can serve as a drop target for detaching a child.
  if (target.row.contextOnly && (placement === "inside" || target.parentId !== null || source.parentId === null))
    return null;
  if (placement === "inside" && target.row.item.type !== "goal") return null;
  const parentId = placement === "inside" ? targetId : target.parentId;
  const changedParent = parentId !== source.parentId;
  if (changedParent && (!canReparent || (parentId && (parentId === id || locate(source.row.children, parentId)))))
    return null;
  // A space map can show an out-of-space ancestor for context. Only reorder its existing children.
  if (changedParent && parentId && locate(draft.rows, parentId)?.row.contextOnly) return null;
  if (!changedParent && placement === "inside") return null;

  return { row: source.row, parentId, changedParent };
}

export function move(
  draft: OrganizationDraft,
  id: string,
  targetId: string,
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
