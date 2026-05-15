const STORAGE_PREFIX = "operately:rich-text-draft:";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

interface DraftPayload {
  content: any;
  baseContent: any;
  updatedAt: number;
}

export interface LocalDraftOptions {
  key?: string;
  enabled?: boolean;
  ttlMs?: number;
}

export function readLocalDraft(options: LocalDraftOptions | undefined, baseContent: any): any | null {
  const key = storageKey(options);
  if (!key) return null;

  const storage = getLocalStorage();
  if (!storage) return null;

  const raw = safeRead(storage, key);
  if (!raw) return null;

  const payload = parsePayload(raw);
  if (!payload) {
    safeRemove(storage, key);
    return null;
  }

  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  if (Date.now() - payload.updatedAt > ttlMs) {
    safeRemove(storage, key);
    return null;
  }

  if (!contentEquals(payload.baseContent, baseContent)) {
    return null;
  }

  return payload.content;
}

export function writeLocalDraft(options: LocalDraftOptions | undefined, content: any, baseContent: any): void {
  const key = storageKey(options);
  if (!key) return;

  const storage = getLocalStorage();
  if (!storage) return;

  if (isRichTextEmpty(content) || contentEquals(content, baseContent)) {
    safeRemove(storage, key);
    return;
  }

  safeWrite(
    storage,
    key,
    JSON.stringify({
      content,
      baseContent: normalizeEmptyContent(baseContent),
      updatedAt: Date.now(),
    } satisfies DraftPayload),
  );
}

export function hasLocalDraft(options: LocalDraftOptions | undefined, baseContent: any): boolean {
  return readLocalDraft(options, baseContent) !== null;
}

export function clearLocalDraft(options: LocalDraftOptions | undefined): void {
  const key = storageKey(options);
  if (!key) return;

  const storage = getLocalStorage();
  if (!storage) return;

  safeRemove(storage, key);
}

export function isRichTextEmpty(content: any): boolean {
  if (!content) return true;
  if (content === "") return true;

  if (typeof content === "string") {
    try {
      return isRichTextEmpty(JSON.parse(content));
    } catch {
      return content.trim() === "";
    }
  }

  if (content.type === "doc" && Array.isArray(content.content)) {
    return content.content.every(isRichTextEmpty);
  }

  if (content.type === "paragraph" && !content.content) {
    return true;
  }

  if (Array.isArray(content.content)) {
    return content.content.every(isRichTextEmpty);
  }

  if (typeof content.text === "string") {
    return content.text.trim() === "";
  }

  return false;
}

function storageKey(options: LocalDraftOptions | undefined): string | null {
  if (!options?.key || options.enabled === false) return null;

  return STORAGE_PREFIX + options.key;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parsePayload(raw: string): DraftPayload | null {
  try {
    const payload = JSON.parse(raw);

    if (typeof payload?.updatedAt !== "number") return null;
    if (!("content" in payload)) return null;
    if (!("baseContent" in payload)) return null;

    return payload;
  } catch {
    return null;
  }
}

function contentEquals(left: any, right: any): boolean {
  return JSON.stringify(normalizeEmptyContent(left)) === JSON.stringify(normalizeEmptyContent(right));
}

function normalizeEmptyContent(content: any): any {
  return isRichTextEmpty(content) ? null : content;
}

function safeRead(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Local drafts are best-effort only.
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Local drafts are best-effort only.
  }
}
