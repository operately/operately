import { addMonths, addWeeks, parseISO, startOfMonth, startOfWeek } from "date-fns";
import type { EditableNumber, TemplateDefinition } from "./types";

export function resolveTemplatePreviewDate(
  referenceDate: string,
  cadence: TemplateDefinition["cadence"],
  offset: EditableNumber,
): Date {
  const reference = parseISO(referenceDate);
  return cadence === "weekly"
    ? addWeeks(startOfWeek(reference, { weekStartsOn: 1 }), Number(offset))
    : addMonths(startOfMonth(reference), Number(offset));
}
