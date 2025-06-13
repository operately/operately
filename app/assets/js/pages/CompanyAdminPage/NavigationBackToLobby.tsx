import * as Paper from "@/components/PaperContainer";
import * as React from "react";

export function NavigationBackToLobby() {
  return <Paper.Navigation items={[{ to: paths.homePath(), label: "Home" }]} />;
}
