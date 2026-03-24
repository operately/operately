import { UsageError } from "./parser-types";
import type { CatalogEndpoint, CatalogField, CatalogTypeRef, CatalogTypes } from "../types/catalog";
import { isGlobalFlag } from "./flags";
import { parseContextualDateString } from "./contextual-date-parser";
import { convertMarkdownToTiptap } from "./markdown-to-tiptap";

const BUILTIN_TYPES = new Set(["string", "integer", "float", "boolean", "date", "time", "datetime", "id", "json"]);

export function parseEndpointInputs(
  endpoint: CatalogEndpoint,
  flags: Map<string, unknown[]>,
  types: CatalogTypes,
): Record<string, unknown> {
  const rawInputs: Record<string, unknown> = {};
  const fieldNames = new Set(endpoint.inputs.map((field) => field.name));

  for (const [flagKey, values] of flags.entries()) {
    if (isGlobalFlag(flagKey)) continue;

    const normalizedPath = flagKey.split(".").map(normalizePathSegment);
    const topLevel = normalizedPath[0];

    if (!fieldNames.has(topLevel)) {
      throw new UsageError(`Unknown input flag '--${flagKey}' for command '${endpoint.name}'.`);
    }

    for (const value of values) {
      rawInputs[topLevel] = setPathValue(rawInputs[topLevel], normalizedPath.slice(1), value);
    }
  }

  return coerceEndpointInputs(endpoint.inputs, rawInputs, types);
}

function normalizePathSegment(segment: string): string {
  if (/^\d+$/.test(segment)) return segment;
  return segment.replace(/-/g, "_");
}

function setPathValue(currentValue: unknown, path: string[], newValue: unknown): unknown {
  if (path.length === 0) {
    if (currentValue === undefined) return newValue;
    if (Array.isArray(currentValue)) return [...currentValue, newValue];
    return [currentValue, newValue];
  }

  const [head, ...tail] = path;
  if (/^\d+$/.test(head)) {
    const index = Number(head);
    const list = Array.isArray(currentValue) ? [...currentValue] : [];
    list[index] = setPathValue(list[index], tail, newValue);
    return list;
  }

  const objectValue =
    currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)
      ? { ...(currentValue as Record<string, unknown>) }
      : {};

  objectValue[head] = setPathValue(objectValue[head], tail, newValue);
  return objectValue;
}

function coerceEndpointInputs(
  fields: CatalogField[],
  raw: Record<string, unknown>,
  types: CatalogTypes,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  const knownFields = new Set(fields.map((field) => field.name));

  for (const key of Object.keys(raw)) {
    if (!knownFields.has(key)) {
      throw new UsageError(`Unknown input field '${key}'.`);
    }
  }

  for (const field of fields) {
    const value = raw[field.name];

    if (value === undefined) {
      if (field.has_default) {
        output[field.name] = field.default;
        continue;
      }

      if (!field.optional) {
        throw new UsageError(`Missing required field '${field.name}'.`);
      }

      continue;
    }

    const coerced = coerceFieldValue(field.type, value, field, types, field.name);
    output[field.name] = coerced;
  }

  return output;
}

function coerceObjectFields(
  fields: CatalogField[],
  value: unknown,
  types: CatalogTypes,
  path: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new UsageError(`Expected object for '${path}', got ${typeof value}.`);
  }

  const raw = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  const fieldByName = new Set(fields.map((field) => field.name));

  for (const key of Object.keys(raw)) {
    if (!fieldByName.has(key)) {
      throw new UsageError(`Unknown nested field '${path}.${key}'.`);
    }
  }

  for (const field of fields) {
    const fieldValue = raw[field.name];

    if (fieldValue === undefined) {
      if (field.has_default) {
        output[field.name] = field.default;
        continue;
      }

      if (!field.optional) {
        throw new UsageError(`Missing required field '${path}.${field.name}'.`);
      }

      continue;
    }

    output[field.name] = coerceFieldValue(field.type, fieldValue, field, types, `${path}.${field.name}`);
  }

  return output;
}

function coerceFieldValue(
  typeRef: CatalogTypeRef,
  value: unknown,
  field: CatalogField,
  types: CatalogTypes,
  path: string,
): unknown {
  if (value === null) {
    if (!field.nullable) {
      throw new UsageError(`Field '${path}' is not nullable.`);
    }
    return null;
  }

  if (typeRef.kind === "list") {
    const list = Array.isArray(value) ? value : [value];
    return list.map((item, i) =>
      coerceFieldValue(typeRef.item, item, { ...field, nullable: false }, types, `${path}[${i}]`),
    );
  }

  const typeName = typeRef.name;

  if (BUILTIN_TYPES.has(typeName)) {
    return coerceBuiltinType(typeName, value, path);
  }

  if (typeName === "contextual_date") {
    return coerceContextualDate(value, types, path);
  }

  if (types.objects[typeName]) {
    return coerceObjectFields(types.objects[typeName].fields, value, types, path);
  }

  if (types.enums[typeName]) {
    if (typeof value !== "string") {
      throw new UsageError(`Expected string for enum '${path}', got ${typeof value}.`);
    }
    if (!types.enums[typeName].includes(value)) {
      throw new UsageError(`Invalid enum value '${value}' for '${path}'. Expected one of: ${types.enums[typeName].join(", ")}.`);
    }
    return value;
  }

  if (types.int_enums[typeName]) {
    const num = Number(value);
    if (!Number.isInteger(num)) {
      throw new UsageError(`Expected integer for enum '${path}', got '${value}'.`);
    }
    if (!types.int_enums[typeName].includes(num)) {
      const validValues = types.int_enums[typeName].map(String).join(", ");
      throw new UsageError(`Invalid enum value '${value}' for '${path}'. Expected one of: ${validValues}.`);
    }
    return num;
  }

  if (types.unions[typeName]) {
    for (const variant of types.unions[typeName]) {
      try {
        return coerceFieldValue(variant, value, field, types, path);
      } catch {
        continue;
      }
    }
    throw new UsageError(`Value for '${path}' does not match any union variant.`);
  }

  throw new UsageError(`Unknown type '${typeName}' for field '${path}'.`);
}

function coerceBuiltinType(typeName: string, value: unknown, path: string): unknown {
  if (typeName === "string") {
    if (typeof value !== "string") {
      throw new UsageError(`Expected string for '${path}', got ${typeof value}.`);
    }
    return value;
  }

  if (typeName === "integer") {
    const num = Number(value);
    if (!Number.isInteger(num)) {
      throw new UsageError(`Expected integer for '${path}', got '${value}'.`);
    }
    return num;
  }

  if (typeName === "float") {
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new UsageError(`Expected float for '${path}', got '${value}'.`);
    }
    return num;
  }

  if (typeName === "boolean") {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new UsageError(`Expected boolean for '${path}', got '${value}'.`);
  }

  if (typeName === "date" || typeName === "time" || typeName === "datetime" || typeName === "id") {
    if (typeof value !== "string") {
      throw new UsageError(`Expected string for '${path}', got ${typeof value}.`);
    }
    return value;
  }

  if (typeName === "json") {
    return coerceJsonType(value, path);
  }

  throw new UsageError(`Unknown builtin type '${typeName}'.`);
}

function coerceJsonType(value: unknown, path: string): string {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  if (typeof value !== "string") {
    throw new UsageError(`Expected string or object for '${path}', got ${typeof value}.`);
  }

  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed);
  } catch {
    try {
      const tiptapJson = convertMarkdownToTiptap(value);
      return JSON.stringify(tiptapJson);
    } catch (error) {
      throw new UsageError(`Failed to parse '${path}' as JSON or markdown: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function coerceContextualDate(value: unknown, types: CatalogTypes, path: string) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return coerceObjectFields(types.objects.contextual_date.fields, value, types, path);
  }

  if (value === "null") {
    return null;
  }

  try {
    return parseContextualDateString(value);
  } catch {
    throw new UsageError(
      `Invalid contextual date format for '${path}': '${value}'. ` +
      `Supported formats: YYYY-MM-DD (day), YYYY (year end), YYYY^ (year start), ` +
      `YYYY/q# (quarter end), YYYY/q#^ (quarter start), YYYY/MM (month end), YYYY/MM^ (month start), null`,
    );
  }
}
