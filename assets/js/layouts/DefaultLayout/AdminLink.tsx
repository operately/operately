import * as React from "react";

import { Paths } from "@/routes/paths";
import { createPath } from "@/utils/paths";
import { GhostButton } from "@/components/Button";

export function AdminLink() {
  if (!Paths.isHomePath()) return null;

  return (
    <div className="flex items-center justify-center">
      <GhostButton linkTo={createPath("company", "admin")} size="sm" type="secondary" testId="go-to-admin">
        <div className="font-bold">Company Admin</div>
      </GhostButton>
    </div>
  );
}
