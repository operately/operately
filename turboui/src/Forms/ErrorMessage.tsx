import * as React from "react";

export function ErrorMessage({ error, id }: { error: string; id?: string }) {
  return (
    <div id={id} className="text-sm block text-content-error" role="alert">
      {error}
    </div>
  );
}
