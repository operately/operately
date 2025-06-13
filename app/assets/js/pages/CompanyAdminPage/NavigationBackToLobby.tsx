import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { usePaths } from "@/routes/paths";
export function NavigationBackToLobby() {
  const paths = usePaths();
  return <Paper.Navigation items={[{ to: paths.homePath(), label: "Home" }]} />;
}
