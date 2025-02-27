import React from "react";
import axios from "axios";

import type * as Types from ".";
import { toCamel, toSnake } from ".";

const globalCache = new Map();

function clearCacheEntry(endpoint: string, id?: string) {
  for (const key of globalCache.keys()) {
    if (typeof key === "string" && key.startsWith(endpoint) && (!id || key.includes(id))) {
      globalCache.delete(key);
    }
  }
}

class ApiClient {
  private basePath: string;
  private headers: any;
  private ttl = 300_000; // 5 minutes
  private pendingRequests = new Map<string, Promise<any>>();

  setBasePath(basePath: string) {
    this.basePath = basePath;
  }

  getBasePath() {
    if (!this.basePath) throw new Error("ApiClient is not configured");
    return this.basePath;
  }

  setHeaders(headers: any) {
    this.headers = headers;
  }

  getHeaders() {
    return this.headers || {};
  }

  private buildKey(path: string, params: any): string {
    const keys = Object.keys(params).sort();
    const searchParams = new URLSearchParams();

    keys.forEach((key) => {
      searchParams.append(key, params[key]);
    });

    return `${this.getBasePath()}${path}?${searchParams.toString()}`;
  }

  private isCached(cachedEntry: any) {
    return cachedEntry && Date.now() - cachedEntry.timestamp < this.ttl;
  }

  private setCacheEntry(key: string, data: any) {
    globalCache.set(key, { data, timestamp: Date.now() });
  }

  private async get(path: string, params: any) {
    const key = this.buildKey(path, params);
    const cachedEntry = globalCache.get(key);

    if (this.isCached(cachedEntry)) {
      console.log("cache hit");
      return cachedEntry.data;
    }

    // Deduplicate in-flight requests
    if (this.pendingRequests.has(key)) {
      console.log("works!!!")
      return this.pendingRequests.get(key);
    }

    const request = axios
      .get(this.getBasePath() + path, {
        params: toSnake(params),
        headers: this.getHeaders(),
      })
      .then((res) => {
        const data = toCamel(res.data);
        this.setCacheEntry(key, data);
        return data;
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  clearGoal(input: Types.GetGoalInput) {
    clearCacheEntry(`${this.getBasePath()}/get_goal?`, input.id || undefined);
  }

  async getGoal(input: Types.GetGoalInput): Promise<Types.GetGoalResult> {
    return this.get("/get_goal", input);
  }
}

export const defaultApiClient = new ApiClient();
defaultApiClient.setBasePath("/api/v2");

export function clearGoal(id: string) {
  defaultApiClient.clearGoal({ id });
}

export async function getGoal(input: Types.GetGoalInput): Promise<Types.GetGoalResult> {
  return defaultApiClient.getGoal(input);
}

function useQuery<ResultT>(fn: () => Promise<ResultT>, clearCache: () => void): Types.UseQueryHookResult<ResultT> {
  const [data, setData] = React.useState<ResultT | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(() => {
    setError(null);
    setLoading(true);

    fn()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => fetchData(), []);

  const refetch = React.useCallback(() => {
    clearCache();
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

export function useGetGoal(input: Types.GetGoalInput): Types.UseQueryHookResult<Types.GetGoalResult> {
  return useQuery<Types.GetGoalResult>(
    () => defaultApiClient.getGoal(input),
    () => defaultApiClient.clearGoal(input),
  );
}
