import type { FormValueUpdater } from "./types";

export function parsePath(path: string): Array<string | number> {
  return path
    .replace(/\]/g, "")
    .split(/\.|\[/)
    .filter(Boolean)
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

export function getValueAtPath<TValue = unknown>(value: unknown, path: string): TValue | undefined {
  return parsePath(path).reduce<unknown>((current, part) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    return (current as Record<string | number, unknown>)[part];
  }, value) as TValue | undefined;
}

export function setValueAtPath<TValue>(
  values: Record<string, unknown>,
  path: string,
  nextValue: FormValueUpdater<TValue>,
): Record<string, unknown> {
  const parts = parsePath(path);

  if (parts.length === 0) {
    return values;
  }

  const clone = cloneFormValue(values);
  let currentTarget: Record<string | number, unknown> | unknown[] = clone;
  let currentSource: Record<string | number, unknown> | unknown[] | undefined = values;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (part === undefined) {
      continue;
    }

    if (index === parts.length - 1) {
      const currentValue = currentSource?.[part] as TValue | undefined;
      currentTarget[part] = resolveNextValue(currentValue, nextValue);
      continue;
    }

    const nextPart = parts[index + 1];
    const sourceValue = currentSource?.[part];
    const nestedValue = cloneBranch(sourceValue, nextPart);

    currentTarget[part] = nestedValue;
    currentTarget = nestedValue as Record<string | number, unknown> | unknown[];
    currentSource = sourceValue as Record<string | number, unknown> | unknown[] | undefined;
  }

  return clone;
}

export function cloneFormValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneFormValue(item)) as T;
  }

  if (isCloneableObject(value)) {
    const clone = Object.create(Object.getPrototypeOf(value));

    for (const [key, entryValue] of Object.entries(value)) {
      clone[key] = cloneFormValue(entryValue);
    }

    return clone;
  }

  return value;
}

function cloneBranch(value: unknown, nextPart: string | number | undefined) {
  if (value === null || value === undefined) {
    return typeof nextPart === "number" ? [] : {};
  }

  return cloneFormValue(value);
}

function resolveNextValue<TValue>(currentValue: TValue | undefined, nextValue: FormValueUpdater<TValue>): TValue {
  if (typeof nextValue === "function") {
    return (nextValue as (currentValue: TValue | undefined) => TValue)(currentValue);
  }

  return nextValue;
}

function isCloneableObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (value instanceof Date) {
    return false;
  }

  if (typeof File !== "undefined" && value instanceof File) {
    return false;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return false;
  }

  return true;
}
