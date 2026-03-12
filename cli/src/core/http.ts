import axios from "axios";
import type { CatalogEndpoint } from "../types/catalog";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export interface RequestOptions {
  endpoint: CatalogEndpoint;
  baseUrl: string;
  token: string;
  inputs: Record<string, unknown>;
  timeoutMs: number;
  verbose?: boolean;
}

export async function callEndpoint(options: RequestOptions): Promise<unknown> {
  const url = buildUrl(options.baseUrl, options.endpoint.path, options.endpoint.type === "query" ? options.inputs : undefined);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.token}`,
  };

  try {
    if (options.verbose) {
      console.error(`[operately] ${options.endpoint.method} ${url}`);
    }

    if (options.endpoint.type === "mutation") {
      const response = await axios.post(url, options.inputs, {
        headers: { ...headers, "Content-Type": "application/json" },
        timeout: options.timeoutMs,
      });
      return response.data ?? null;
    }

    const response = await axios.get(url, {
      headers,
      timeout: options.timeoutMs,
    });
    return response.data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new ApiError(`Request timed out after ${options.timeoutMs}ms`, 0, null);
      }

      if (error.response) {
        throw new ApiError(`API request failed with status ${error.response.status}`, error.response.status, error.response.data ?? null);
      }

      throw new ApiError("Network error while calling API endpoint", 0, null);
    }

    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(`Request timed out after ${options.timeoutMs}ms`, 0, null);
    }

    throw new ApiError("Network error while calling API endpoint", 0, null);
  }
}

function buildUrl(baseUrl: string, endpointPath: string, query?: Record<string, unknown>): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const url = new URL(`${normalizedBase}${endpointPath}`);

  if (query) {
    const pairs = toQueryPairs(query);
    for (const [key, value] of pairs) {
      url.searchParams.append(key, value);
    }
  }

  return url.toString();
}

function toQueryPairs(input: Record<string, unknown>): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(input)) {
    appendQueryValue(pairs, key, value);
  }

  return pairs;
}

function appendQueryValue(pairs: Array<[string, string]>, key: string, value: unknown): void {
  if (value === undefined) return;

  if (value === null) {
    pairs.push([key, "null"]);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      if (isPrimitive(entry)) {
        appendQueryValue(pairs, `${key}[]`, entry);
      } else {
        appendQueryValue(pairs, `${key}[${index}]`, entry);
      }
    });
    return;
  }

  if (typeof value === "object") {
    for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      appendQueryValue(pairs, `${key}[${nestedKey}]`, nestedValue);
    }
    return;
  }

  pairs.push([key, String(value)]);
}

function isPrimitive(value: unknown): boolean {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}
