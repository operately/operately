import type { EditableNumber, TemplateDefinition, TemplateType } from "../types";

export function readDefinition(serialized?: string): TemplateDefinition {
  const definition: TemplateDefinition = JSON.parse(serialized ?? "{}");
  return {
    ...definition,
    targets: definition.targets?.map((target, index) => ({ ...target, editorKey: `target-${index}` })),
  };
}

export function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const destination = index + delta;
  if (destination < 0 || destination >= items.length) return items;
  const result = [...items];
  const item = result.splice(index, 1)[0];
  if (item !== undefined) result.splice(destination, 0, item);
  return result;
}

export function removeMilestone(definition: TemplateDefinition, key: string): TemplateDefinition {
  return {
    ...definition,
    milestones: definition.milestones?.filter((milestone) => milestone.key !== key),
    tasks: definition.tasks?.map((task) => (task.milestone_key === key ? { ...task, milestone_key: null } : task)),
  };
}

export function numeric(value: EditableNumber | undefined): number | null {
  return value === "" || value == null ? null : Number(value);
}

export function serializeDefinition(type: TemplateType, definition: TemplateDefinition): string {
  const common = { name: definition.name ?? null, description: definition.description ?? null };
  if (type === "kpi")
    return JSON.stringify({ ...common, unit: definition.unit ?? null, cadence: definition.cadence ?? null });
  const timed = { ...common, duration_days: numeric(definition.duration_days) };
  if (type === "goal")
    return JSON.stringify({
      ...timed,
      targets: (definition.targets ?? []).map(({ name, unit, from, to }) => ({
        name: name ?? null,
        unit: unit ?? null,
        from: numeric(from),
        to: numeric(to),
      })),
    });
  return JSON.stringify({
    ...timed,
    milestones: (definition.milestones ?? []).map(({ key, title, due_offset_days }) => ({
      key,
      title: title ?? null,
      due_offset_days: numeric(due_offset_days),
    })),
    tasks: (definition.tasks ?? []).map(({ key, name, description, milestone_key, due_offset_days }) => ({
      key,
      name: name ?? null,
      description: description ?? null,
      milestone_key: milestone_key || null,
      due_offset_days: numeric(due_offset_days),
    })),
  });
}
