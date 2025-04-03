import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import { Paths } from "@/routes/paths";

export function NavigationBackToLobby() {
  return <Paper.Navigation items={[{ to: Paths.homePath(), label: "Home" }]} />;
}
