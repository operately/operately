import React from "react";
import { useLocation } from "react-router-dom";
import { createPath } from "@/utils/paths";
import { GhostButton } from "@/components/Button";

export function AdminLink() {
  const isRootPath = useLocation().pathname === "/";
  if (!isRootPath) return null;

  return (
    <div className="flex items-center justify-center">
      <GhostButton linkTo={createPath("company", "admin")} size="sm" type="secondary">
        <div className="font-bold">Company Admin</div>
      </GhostButton>
    </div>
  );
}
