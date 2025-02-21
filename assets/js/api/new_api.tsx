import React from "react";
import axios from "axios";
import { mutate } from "swr";

import type * as Types from ".";
import { toCamel, toSnake } from ".";

export const globalCache = new Map();

class ApiClient {
  private basePath: string;
  private headers: any;

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

  // Build a unique cache key based on the URL and parameters.
  private buildKey(path: string, params: any): string {
    const queryString = new URLSearchParams(toSnake(params)).toString();
    return `${this.getBasePath()}${path}?${queryString}`;
  }

  // @ts-ignore
  private async get(path: string, params: any) {
    console.log(globalCache)
    const key = this.buildKey(path, params);
    const cachedData = globalCache.get(key);

    if (cachedData) {
      console.log("cache hit");
      return cachedData;
    }

    const response = await axios.get(this.getBasePath() + path, {
      params: toSnake(params),
      headers: this.getHeaders(),
    });
    const data = toCamel(response.data);

    globalCache.set(key, data);
    console.log("request");
    return data;
  }

  getGoalKey(input: Types.GetGoalInput): string {
    return this.buildKey("/get_goal", input);
  }

  async getGoal(input: Types.GetGoalInput): Promise<Types.GetGoalResult> {
    return this.get("/get_goal", input);
  }
}

export const defaultApiClient = new ApiClient();
defaultApiClient.setBasePath("/api/v2");

export async function getGoal(input: Types.GetGoalInput): Promise<Types.GetGoalResult> {
  return defaultApiClient.getGoal(input);
}

export function useQuery<ResultT>(fn: () => Promise<ResultT>, cacheKey: string): Types.UseQueryHookResult<ResultT> {
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
    mutate(cacheKey, undefined, false);
    fetchData();
  }, [cacheKey, fetchData]);

  return { data, loading, error, refetch };
}

export function useGetGoal(input: Types.GetGoalInput): Types.UseQueryHookResult<Types.GetGoalResult> {
  return useQuery<Types.GetGoalResult>(() => defaultApiClient.getGoal(input), defaultApiClient.getGoalKey(input));
}
