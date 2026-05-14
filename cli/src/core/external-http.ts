import axios from "axios";
import { ApiError } from "./http";
import { externalApiUrl } from "./paths";

// Custom CLI flows sometimes need to call hidden external endpoints such as
// `create_avatar_blob`. Those endpoints are intentionally excluded from the
// generated catalog, so we do not have a `CatalogEndpoint` for them at runtime.
// `callEndpoint` from http.ts cannot be used in that case because it requires a catalog
// entry to supply the path and endpoint kind. 
export async function callExternalMutation(
  baseUrl: string,
  path: string,
  inputs: Record<string, unknown>,
  token: string,
  timeoutMs: number,
  verbose = false,
): Promise<unknown> {
  const url = externalApiUrl(baseUrl, path);
  const headers = withE2EUserAgent({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  try {
    if (verbose) {
      console.error(`[operately] POST ${url}`);
    }

    const response = await axios.post(url, inputs, { headers, timeout: timeoutMs });
    return response.data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, 0, null);
      }

      if (error.response) {
        throw new ApiError(`API request failed with status ${error.response.status}`, error.response.status, error.response.data ?? null);
      }

      throw new ApiError("Network error while calling external API endpoint", 0, null);
    }

    throw new ApiError("Network error while calling external API endpoint", 0, null);
  }
}

function withE2EUserAgent(headers: Record<string, string>): Record<string, string> {
  const userAgent = process.env.OPERATELY_E2E_USER_AGENT;

  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }

  return headers;
}
