import axios, { type AxiosError } from "axios";
import { showErrorToast } from "turboui";

const RELOAD_DELAY_MS = 1000;
const RELOAD_VERSION_STORAGE_KEY = "operately.stale-client-reload-version";
const VERSION_HEADER_NAME = "x-operately-version";

let pendingReload: ReturnType<typeof setTimeout> | null = null;

export function handleStaleClientError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    console.log("handleStaleClientError: not an axios error");
    return;
  }

  const status = error.response?.status;
  if (status !== 404 && status !== 410) {
    console.log("handleStaleClientError: status is not 404 or 410", status);
    return;
  }

  const serverVersion = getVersionHeader(error);
  if (!serverVersion || serverVersion === window.appConfig.version) {
    console.log("handleStaleClientError: no server version or versions match", serverVersion, window.appConfig.version);
    return;
  }
  if (sessionStorage.getItem(RELOAD_VERSION_STORAGE_KEY) === serverVersion) {
    console.log("handleStaleClientError: already reloaded for this version", serverVersion);
    return;
  }

  sessionStorage.setItem(RELOAD_VERSION_STORAGE_KEY, serverVersion);

  showErrorToast("App updated", "This tab is out of date. Reloading to get the latest version...");

  if (pendingReload) {
    console.log("handleStaleClientError: reload already pending");
    return;
  }

  pendingReload = setTimeout(() => {
    pendingReload = null;
    window.location.reload();
  }, RELOAD_DELAY_MS);
}

function getVersionHeader(error: AxiosError) {
  const headers = error.response?.headers;
  if (!headers) return null;

  if ("get" in headers && typeof headers.get === "function") {
    return headers.get(VERSION_HEADER_NAME) ?? headers.get(VERSION_HEADER_NAME.toLowerCase());
  }

  const value = headers[VERSION_HEADER_NAME] ?? headers[VERSION_HEADER_NAME.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function resetStaleClientReloadForTest() {
  if (pendingReload) {
    clearTimeout(pendingReload);
    pendingReload = null;
  }
}
