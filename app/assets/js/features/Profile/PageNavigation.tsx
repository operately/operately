import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { DeprecatedPaths } from "@/routes/paths";

export function PageNavigation() {
  return <Paper.Navigation items={[{ to: DeprecatedPaths.peoplePath(), label: "People" }]} />;
}
