import { ContextualDate } from "@/api";
import * as Time from "@/utils/time";
import { DateField } from "turboui";

/**
 * Takes a ContextualDate object and returns a DateField.ContextualDate object that can be used in the UI.
 *
 * @param {ContextualDate | null | undefined} obj The ContextualDate object to parse.
 * @returns {DateField.ContextualDate | undefined} The DateField.ContextualDate object that was parsed, or undefined if the input was null or undefined.
 */
export function parseContextualDate(obj: ContextualDate | undefined | null): DateField.ContextualDate | null {
  if (!obj) return null;

  return {
    date: new Date(obj.date),
    dateType: obj.dateType,
    value: obj.value,
  };
}

/**
 * Takes a DateField.ContextualDate object and returns a ContextualDate object that can be sent to the server.
 *
 * @param {DateField.ContextualDate | null | undefined} obj The DateField.ContextualDate object to serialize.
 * @returns {ContextualDate | null} The ContextualDate object that was serialized, or null if the input was null or undefined.
 */
export function serializeContextualDate(obj: DateField.ContextualDate | undefined | null): ContextualDate | null {
  if (!obj) return null;

  return {
    date: Time.toDateWithoutTime(obj.date),
    dateType: obj.dateType,
    value: obj.value,
  };
}
