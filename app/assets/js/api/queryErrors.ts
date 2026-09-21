import { handleStaleClientError } from "./staleClient";

const reported = new WeakSet<object>();

/** A failed preload is silent until navigation or a mounted query needs it. */
export function reportQueryError(error: unknown) {
  if (typeof error !== "object" || error === null || reported.has(error)) return;
  reported.add(error);
  handleStaleClientError(error);
}
