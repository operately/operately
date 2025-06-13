import * as Paper from "@/components/PaperContainer";
import { DeprecatedPaths } from "@/routes/paths";
import * as React from "react";

export function NavigationBackToLobby() {
  return <Paper.Navigation items={[{ to: DeprecatedPaths.homePath(), label: "Home" }]} />;
}
