import React from "react";

import { SpacePermissionSelector } from "@/features/Permissions";


export function SpaceAccessLevel() {
  return (
    <div className="flex flex-col gap-4">
      <SpacePermissionSelector />
    </div>
  );
}
