import axios from "axios";
import { ApiError } from "./http";
import { internalApiUrl } from "./paths";

export async function callInternalMutation(
  baseUrl: string,
  path: string,
  inputs: Record<string, unknown>,
  bootstrapToken?: string,
): Promise<unknown> {
  const url = internalApiUrl(baseUrl, path);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (bootstrapToken) {
    headers.Authorization = `Bearer ${bootstrapToken}`;
  }

  try {
    const response = await axios.post(url, inputs, { headers });
    return response.data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        `API request failed with status ${error.response.status}`,
        error.response.status,
        error.response.data ?? null,
      );
    }
    throw new ApiError("Network error while calling internal API endpoint", 0, null);
  }
}

export async function callInternalQuery(
  baseUrl: string,
  path: string,
  inputs: Record<string, unknown>,
  bootstrapToken?: string,
): Promise<unknown> {
  const url = internalApiUrl(baseUrl, path);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(inputs)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  const queryString = params.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  const headers: Record<string, string> = {};
  if (bootstrapToken) {
    headers.Authorization = `Bearer ${bootstrapToken}`;
  }

  try {
    const response = await axios.get(fullUrl, { headers });
    return response.data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        `API request failed with status ${error.response.status}`,
        error.response.status,
        error.response.data ?? null,
      );
    }
    throw new ApiError("Network error while calling internal API endpoint", 0, null);
  }
}

