import * as Paper from "@/components/PaperContainer";
import * as React from "react";

export function PageNavigation() {
  return <Paper.Navigation items={[{ to: DeprecatedPaths.peoplePath(), label: "People" }]} />;
}
