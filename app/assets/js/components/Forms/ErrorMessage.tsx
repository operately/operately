import * as React from "react";

export function ErrorMessage({ error }: { error: string }) {
  return <div className="text-sm block text-content-error">{error}</div>;
}
