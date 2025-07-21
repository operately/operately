import { ContextualDate } from "@/api";
import * as Time from "@/utils/time";
import { DatePicker } from "turboui";

/**
 * Takes a ContextualDate object and returns a DatePicker.ContextualDate object that can be used in the UI.
 *
 * @param {ContextualDate | null | undefined} obj The ContextualDate object to parse.
 * @returns {DatePicker.ContextualDate | undefined} The DatePicker.ContextualDate object that was parsed, or undefined if the input was null or undefined.
 */
export function parseContextualDate(obj: ContextualDate | undefined | null): DatePicker.ContextualDate | null {
  if (!obj) return null;

  return {
    date: new Date(obj.date),
    dateType: obj.dateType,
    value: obj.value,
  };
}

/**
 * Takes a DatePicker.ContextualDate object and returns a ContextualDate object that can be sent to the server.
 *
 * @param {DatePicker.ContextualDate | null | undefined} obj The DatePicker.ContextualDate object to serialize.
 * @returns {ContextualDate | null} The ContextualDate object that was serialized, or null if the input was null or undefined.
 */
export function serializeContextualDate(obj: DatePicker.ContextualDate | undefined | null): ContextualDate | null {
  if (!obj) return null;

  return {
    date: Time.toDateWithoutTime(obj.date),
    dateType: obj.dateType,
    value: obj.value,
  };
}
